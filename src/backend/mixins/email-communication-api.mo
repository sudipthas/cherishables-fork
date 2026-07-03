import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import EmailClient "mo:caffeineai-email/emailClient";
import CommonTypes "../types/common";
import EmailTypes "../types/email-communication";
import EmailLib "../lib/email-communication";
import Array "mo:core/Array";

mixin (
  accessControlState : AccessControl.AccessControlState,
  orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>,
  emailTemplates : Map.Map<EmailTypes.EmailTemplateId, EmailTypes.EmailTemplate>,
  communicationLogs : Map.Map<Text, EmailTypes.CommunicationLog>,
  adminEmailConfig : { var config : EmailTypes.AdminEmailConfig },
  emailState : { var templatesSeeded : Bool; var nextLogId : Nat },
) {

  // Seed default templates on first deploy and add missing ones on upgrade
  if (not emailState.templatesSeeded) {
    let defaults = EmailLib.getDefaultTemplates();
    for (t in defaults.vals()) {
      emailTemplates.add(t.id, t);
    };
    emailState.templatesSeeded := true;
  } else {
    let defaults = EmailLib.getDefaultTemplates();
    for (t in defaults.vals()) {
      if (emailTemplates.get(t.id) == null) {
        emailTemplates.add(t.id, t);
      };
    };
  };

  /// List all email templates — admin only.
  public query ({ caller }) func listEmailTemplates() : async [EmailTypes.EmailTemplate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    emailTemplates.values().toArray();
  };

  /// Get a single email template by ID — admin only.
  public query ({ caller }) func getEmailTemplate(id : EmailTypes.EmailTemplateId) : async ?EmailTypes.EmailTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    emailTemplates.get(id);
  };

  /// Update an email template — admin only.
  public shared ({ caller }) func updateEmailTemplate(
    id : EmailTypes.EmailTemplateId,
    template : EmailTypes.EmailTemplate,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    emailTemplates.add(id, template);
  };

  /// Toggle template active status — admin only.
  public shared ({ caller }) func toggleTemplateActive(
    id : EmailTypes.EmailTemplateId,
    isActive : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (emailTemplates.get(id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?existing) {
        emailTemplates.add(id, { existing with isActive = isActive });
      };
    };
  };

  /// Get admin email configuration — admin only.
  public query ({ caller }) func getAdminEmailConfig() : async EmailTypes.AdminEmailConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    adminEmailConfig.config;
  };

  /// Update admin email configuration — admin only.
  public shared ({ caller }) func updateAdminEmailConfig(
    req : EmailTypes.UpdateAdminEmailConfigRequest,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    adminEmailConfig.config := {
      adminEmail = req.adminEmail;
      fromName = req.fromName;
      isEnabled = req.isEnabled;
      replyTo = req.replyTo;
    };
  };

  /// Send a payment reminder email for an unpaid order — admin only.
  public shared ({ caller }) func sendPaymentReminder(
    orderId : CommonTypes.OrderId,
  ) : async EmailTypes.SendTemplateEmailResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not adminEmailConfig.config.isEnabled) {
      return #err("Email communication is disabled");
    };

    switch (orders.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        let isUnpaid = switch (order.paymentStatus) {
          case (#Pending) { true };
          case (#Failed) { true };
          case (#AdvancePaid) { true };
          case (#Paid) { false };
        };
        if (not isUnpaid) {
          return #err("Order is already paid");
        };

        let templateId = "template_payment_reminder";
        switch (emailTemplates.get(templateId)) {
          case (null) { return #err("Payment reminder template not found") };
          case (?template) {
            if (not template.isActive) {
              return #err("Payment reminder template is inactive");
            };

            let baseVariables = buildEmailOrderVariables(order);
            let paymentMethodText = switch (order.paymentMethod) {
              case (?#Razorpay) { "Razorpay" };
              case (?#COD) { "Cash on Delivery" };
              case null { "Not selected" };
            };
            let productName = if (order.orderItems.size() > 0) {
              order.orderItems[0].name;
            } else {
              "Custom Portrait";
            };
            let daysPending = ((Time.now() - order.createdAt) / 86400000000000).toText();
            let paymentUrl = "https://cherishables.shop/order-status/" # order.orderId;

            let extraVars : [(Text, Text)] = [
              ("paymentMethod", paymentMethodText),
              ("productName", productName),
              ("daysPending", daysPending),
              ("paymentUrl", paymentUrl),
            ];
            let allVariables = baseVariables.concat(extraVars);

            let (subject, body) = EmailLib.replaceVariables(template, allVariables);

            let logId = "log-" # emailState.nextLogId.toText();
            emailState.nextLogId += 1;

            let log = EmailLib.createLog(
              logId,
              orderId,
              templateId,
              template.name,
              order.customerEmail,
              subject,
              body,
              #Pending,
              null,
              null,
            );

            communicationLogs.add(logId, log);

            let result = await EmailClient.sendServiceEmail(
              adminEmailConfig.config.fromName,
              [order.customerEmail],
              subject,
              body,
            );

            let updatedLog = switch (result) {
              case (#ok) {
                {
                  log with
                  status = #Sent;
                  sentAt = ?Time.now();
                  messages = log.messages;
                }
              };
              case (#err(msg)) {
                {
                  log with
                  status = #Failed;
                  errorMessage = ?msg;
                  messages = log.messages;
                }
              };
            };

            communicationLogs.add(logId, updatedLog);
            #ok(updatedLog);
          };
        };
      };
    };
  };

  /// Send a templated email for an order — admin only.
  public shared ({ caller }) func sendTemplateEmail(
    req : EmailTypes.SendTemplateEmailRequest,
  ) : async EmailTypes.SendTemplateEmailResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not adminEmailConfig.config.isEnabled) {
      return #err("Email communication is disabled");
    };

    let orderId = req.orderId;
    let templateId = req.templateId;

    switch (orders.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        switch (emailTemplates.get(templateId)) {
          case (null) { return #err("Template not found") };
          case (?template) {
            if (not template.isActive) {
              return #err("Template is inactive");
            };

            let baseVariables = buildEmailOrderVariables(order);
            let customVars = req.customVariables;
            let allVariables = baseVariables.concat(customVars);

            let (subject, body) = EmailLib.replaceVariables(template, allVariables);

            let logId = "log-" # emailState.nextLogId.toText();
            emailState.nextLogId += 1;

            let log = EmailLib.createLog(
              logId,
              orderId,
              templateId,
              template.name,
              order.customerEmail,
              subject,
              body,
              #Pending,
              null,
              null,
            );

            communicationLogs.add(logId, log);

            let result = await EmailClient.sendServiceEmail(
              adminEmailConfig.config.fromName,
              [order.customerEmail],
              subject,
              body,
            );

            let updatedLog = switch (result) {
              case (#ok) {
                {
                  log with
                  status = #Sent;
                  sentAt = ?Time.now();
                  messages = log.messages;
                }
              };
              case (#err(msg)) {
                {
                  log with
                  status = #Failed;
                  errorMessage = ?msg;
                  messages = log.messages;
                }
              };
            };

            communicationLogs.add(logId, updatedLog);
            #ok(updatedLog);
          };
        };
      };
    };
  };

  /// List communication logs for an order — admin only.
  public query ({ caller }) func listCommunicationLogs(
    orderId : CommonTypes.OrderId,
  ) : async [EmailTypes.CommunicationLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let logs = communicationLogs.values().toArray();
    logs.filter(func(log : EmailTypes.CommunicationLog) : Bool {
      log.orderId == orderId;
    });
  };

  /// List all communication logs — admin only.
  public query ({ caller }) func listAllCommunicationLogs() : async [EmailTypes.CommunicationLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    communicationLogs.values().toArray();
  };

  /// Get public communication logs for an order — no auth required.
  /// Get public communication logs for an order — no auth required.
  public query func getPublicCommunicationLogs(orderId : CommonTypes.OrderId) : async [EmailTypes.CommunicationLog] {
    let logs = communicationLogs.values().toArray();
    logs.filter(func(log : EmailTypes.CommunicationLog) : Bool {
      log.orderId == orderId;
    });
  };

  /// Add a customer reply via public endpoint (no auth required).
  public shared func addCustomerReplyPublic(
    orderId : CommonTypes.OrderId,
    message : Text,
    senderEmail : Text,
  ) : async EmailTypes.SendTemplateEmailResponse {
    switch (orders.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        let logId = "log-" # emailState.nextLogId.toText();
        emailState.nextLogId += 1;

        let replyMessage : EmailTypes.CommunicationMessage = {
          isRead = false;
          direction = #Received;
          body = message;
          timestamp = Time.now();
          author = ?senderEmail;
        };

        let newLog : EmailTypes.CommunicationLog = {
          adminSeenAt = null;
          id = logId;
          orderId = orderId;
          templateId = "customer-reply";
          templateName = "Customer Reply";
          recipientEmail = senderEmail;
          subject = "Customer Reply for Order " # orderId;
          body = message;
          status = #Sent;
          sentAt = ?Time.now();
          errorMessage = null;
          messages = [replyMessage];
        };

        communicationLogs.add(logId, newLog);
        #ok(newLog);
      };
    };
  };

  /// Add a customer reply to an existing communication log — admin only.
  public shared ({ caller }) func addCustomerReply(
    orderId : CommonTypes.OrderId,
    templateId : EmailTypes.EmailTemplateId,
    body : Text,
  ) : async EmailTypes.SendTemplateEmailResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let logs = communicationLogs.values().toArray();
    let matchingLog = logs.find(func(log : EmailTypes.CommunicationLog) : Bool {
      log.orderId == orderId and log.templateId == templateId;
    });

    switch (matchingLog) {
      case (null) {
        // No existing log — create a new one with a single #Received message
        let logId = "log-" # emailState.nextLogId.toText();
        emailState.nextLogId += 1;

        let replyMessage : EmailTypes.CommunicationMessage = {
          isRead = false;
          direction = #Received;
          body = body;
          timestamp = Time.now();
          author = null;
        };

        let newLog : EmailTypes.CommunicationLog = {
          adminSeenAt = null;
          id = logId;
          orderId = orderId;
          templateId = templateId;
          templateName = "Customer Reply";
          recipientEmail = "";
          subject = "";
          body = "";
          status = #Sent;
          sentAt = ?Time.now();
          errorMessage = null;
          messages = [replyMessage];
        };

        communicationLogs.add(logId, newLog);
        #ok(newLog);
      };
      case (?log) {
        let replyMessage : EmailTypes.CommunicationMessage = {
          isRead = false;
          direction = #Received;
          body = body;
          timestamp = Time.now();
          author = null;
        };

        let updatedMessages = log.messages.concat([replyMessage]);
        let updatedLog = { log with messages = updatedMessages };
        communicationLogs.add(log.id, updatedLog);
        #ok(updatedLog);
      };
    };
  };

  /// Send a custom email (not from template) — admin only.
  public shared ({ caller }) func sendCustomEmail(
    orderId : CommonTypes.OrderId,
    subject : Text,
    body : Text,
  ) : async EmailTypes.SendTemplateEmailResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not adminEmailConfig.config.isEnabled) {
      return #err("Email communication is disabled");
    };

    switch (orders.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        let logId = "log-" # emailState.nextLogId.toText();
        emailState.nextLogId += 1;

        let log = EmailLib.createLog(
          logId,
          orderId,
          "custom",
          "Custom Email",
          order.customerEmail,
          subject,
          body,
          #Pending,
          null,
          null,
        );

        communicationLogs.add(logId, log);

        let result = await EmailClient.sendServiceEmail(
          adminEmailConfig.config.fromName,
          [order.customerEmail],
          subject,
          body,
        );

        let updatedLog = switch (result) {
          case (#ok) {
            {
              log with
              status = #Sent;
              sentAt = ?Time.now();
              messages = log.messages;
            }
          };
          case (#err(msg)) {
            {
              log with
              status = #Failed;
              errorMessage = ?msg;
              messages = log.messages;
            }
          };
        };

        communicationLogs.add(logId, updatedLog);
        #ok(updatedLog);
      };
    };
  };

  // --- Private helpers ---

  private func buildEmailOrderVariables(order : CommonTypes.Order) : [(Text, Text)] {
    let statusText = EmailLib.orderStatusToText(order.orderStatus);
    let amountText = EmailLib.formatAmount(order.amount);
    let deliveryDate = order.estimatedDeliveryText;
    let portraitTypeText = switch (order.portraitTypeText) {
      case (?t) { if (t != "") t else EmailLib.orderStatusToText(order.orderStatus) };
      case null { EmailLib.orderStatusToText(order.orderStatus) };
    };
    let productNames = switch (order.selectedAddOns) {
      case (?json) { json };
      case null { "" };
    };
    [
      ("customerName", order.customerName),
      ("orderId", order.orderId),
      ("trackingId", order.orderId),
      ("status", statusText),
      ("totalAmount", amountText),
      ("productNames", productNames),
      ("deliveryDate", deliveryDate),
      ("portraitType", portraitTypeText),
      ("cartoonStyle", order.cartoonStyle),
    ];
  };
}
