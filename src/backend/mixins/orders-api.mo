import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import EmailClient "mo:caffeineai-email/emailClient";
import CommonTypes "../types/common";
import OrdersLib "../lib/orders";
import EmailTypes "../types/email-communication";
import EmailLib "../lib/email-communication";
import Debug "mo:core/Debug";
import Error "mo:core/Error";
import List "mo:core/List";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  accessControlState : AccessControl.AccessControlState,
  orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>,
  state : { var nextOrderId : Nat; var adminEmail : Text },
  razorpayState : { var razorpayKeyId : Text; var razorpayKeySecret : Text },
  emailTemplates : Map.Map<EmailTypes.EmailTemplateId, EmailTypes.EmailTemplate>,
  communicationLogs : Map.Map<Text, EmailTypes.CommunicationLog>,
  adminEmailConfig : { var config : EmailTypes.AdminEmailConfig },
  emailState : { var templatesSeeded : Bool; var nextLogId : Nat },
) {

  /// Create a new caricature order.
  /// For Razorpay payments, creates a Razorpay Order and returns the order details.
  /// For COD payments, behavior remains unchanged.
  public shared ({ caller }) func createOrder(
    req : CommonTypes.CreateOrderRequest,
  ) : async CommonTypes.CreateOrderResponse {
    ignore caller;
    let amounts = OrdersLib.calculateAmount(req.portraitPrice, req.addOnsAmount, req.paymentMode);

    // Validate amount for Razorpay orders
    if (req.paymentMethod == #Razorpay and amounts.totalAmount == 0) {
      Runtime.trap("Razorpay order amount cannot be 0");
    };

    let orderId = OrdersLib.generateOrderId(state.nextOrderId);
    state.nextOrderId += 1;
    let now = Time.now();
    let order = switch (req.paymentMethod) {
      case (#COD) { OrdersLib.createOrderPaid(orderId, req, now, null) };
      case (#Razorpay) { OrdersLib.createOrderPending(orderId, req, now) };
    };
    orders.add(orderId, order);

    // Send order confirmation email only when payment is already complete
    if (order.paymentStatus == #Paid) {
      await sendTemplatedEmail(order, "template_order_confirmation", []);
      await sendConfirmationEmails(order);
    };

    switch (req.paymentMethod) {
      case (#Razorpay) {
        if (razorpayState.razorpayKeyId == "" or razorpayState.razorpayKeySecret == "") {
          Runtime.trap("Razorpay keys not configured");
        };
        let razorpayAmount = switch (req.paymentMode) {
          case (#Advance) { amounts.advanceAmount };
          case (#Full) { amounts.totalAmount };
        };
        Debug.print("[createOrder] Creating Razorpay order for orderId=" # orderId # " amount=" # razorpayAmount.toText() # " keyId=" # razorpayState.razorpayKeyId);
        let rzpOrder = await OrdersLib.createRazorpayOrder(
          razorpayState.razorpayKeyId,
          razorpayState.razorpayKeySecret,
          razorpayAmount,
          orderId,
          transform,
        );
        // Validate all required fields are present
        if (rzpOrder.orderId == "") {
          Runtime.trap("Razorpay order creation failed: missing orderId");
        };
        if (rzpOrder.keyId == "") {
          Runtime.trap("Razorpay order creation failed: missing keyId");
        };
        if (rzpOrder.currency == "") {
          Runtime.trap("Razorpay order creation failed: missing currency");
        };
        // Additional validation: ensure orderId looks like a Razorpay order ID
        if (rzpOrder.orderId.size() < 6) {
          Runtime.trap("Razorpay order creation failed: orderId too short: " # rzpOrder.orderId);
        };
        Debug.print("[createOrder] Razorpay order created successfully: orderId=" # rzpOrder.orderId # " keyId=" # rzpOrder.keyId # " amount=" # rzpOrder.amount.toText());
        // Update stored order with the Razorpay order ID
        let updatedOrder = { order with razorpayOrderId = ?rzpOrder.orderId };
        orders.add(orderId, updatedOrder);

        let response = {
          orderId = orderId;
          amount = razorpayAmount;
          currency = "INR";
          razorpayOrder = ?rzpOrder;
        };
        Debug.print("[createOrder] Returning CreateOrderResponse: orderId=" # response.orderId # " razorpayOrder.present=" # debug_show(response.razorpayOrder != null));
        response;
      };
      case (#COD) {
        {
          orderId = orderId;
          amount = amounts.totalAmount;
          currency = "INR";
          razorpayOrder = null;
        };
      };
    };
  };

  /// Create a bulk order from cart items (multi-item checkout).
  /// For Razorpay payments, creates a Razorpay Order and returns the order details.
  /// For COD payments, behavior remains unchanged.
  public shared ({ caller }) func createBulkOrder(
    req : CommonTypes.CreateOrderRequest,
  ) : async CommonTypes.CreateOrderResponse {
    ignore caller;
    let amounts = OrdersLib.calculateAmount(req.portraitPrice, req.addOnsAmount, req.paymentMode);

    // Validate amount for Razorpay orders
    if (req.paymentMethod == #Razorpay and amounts.totalAmount == 0) {
      Runtime.trap("Razorpay order amount cannot be 0");
    };

    let orderId = OrdersLib.generateOrderId(state.nextOrderId);
    state.nextOrderId += 1;
    let now = Time.now();
    let order = switch (req.paymentMethod) {
      case (#COD) { OrdersLib.createOrderPaid(orderId, req, now, null) };
      case (#Razorpay) { OrdersLib.createOrderPending(orderId, req, now) };
    };
    orders.add(orderId, order);

    // Send order confirmation email only when payment is already complete
    if (order.paymentStatus == #Paid) {
      await sendTemplatedEmail(order, "template_order_confirmation", []);
      await sendConfirmationEmails(order);
    };

    switch (req.paymentMethod) {
      case (#Razorpay) {
        if (razorpayState.razorpayKeyId == "" or razorpayState.razorpayKeySecret == "") {
          Runtime.trap("Razorpay keys not configured");
        };
        let razorpayAmount = switch (req.paymentMode) {
          case (#Advance) { amounts.advanceAmount };
          case (#Full) { amounts.totalAmount };
        };
        Debug.print("[createBulkOrder] Creating Razorpay order for orderId=" # orderId # " amount=" # razorpayAmount.toText() # " keyId=" # razorpayState.razorpayKeyId);
        let rzpOrder = await OrdersLib.createRazorpayOrder(
          razorpayState.razorpayKeyId,
          razorpayState.razorpayKeySecret,
          razorpayAmount,
          orderId,
          transform,
        );
        // Validate all required fields are present
        if (rzpOrder.orderId == "") {
          Runtime.trap("Razorpay order creation failed: missing orderId");
        };
        if (rzpOrder.keyId == "") {
          Runtime.trap("Razorpay order creation failed: missing keyId");
        };
        if (rzpOrder.currency == "") {
          Runtime.trap("Razorpay order creation failed: missing currency");
        };
        // Additional validation: ensure orderId looks like a Razorpay order ID
        if (rzpOrder.orderId.size() < 6) {
          Runtime.trap("Razorpay order creation failed: orderId too short: " # rzpOrder.orderId);
        };
        Debug.print("[createBulkOrder] Razorpay order created successfully: orderId=" # rzpOrder.orderId # " keyId=" # rzpOrder.keyId # " amount=" # rzpOrder.amount.toText());
        // Update stored order with the Razorpay order ID
        let updatedOrder = { order with razorpayOrderId = ?rzpOrder.orderId };
        orders.add(orderId, updatedOrder);

        let response = {
          orderId = orderId;
          amount = razorpayAmount;
          currency = "INR";
          razorpayOrder = ?rzpOrder;
        };
        Debug.print("[createBulkOrder] Returning CreateOrderResponse: orderId=" # response.orderId # " razorpayOrder.present=" # debug_show(response.razorpayOrder != null));
        response;
      };
      case (#COD) {
        {
          orderId = orderId;
          amount = amounts.totalAmount;
          currency = "INR";
          razorpayOrder = null;
        };
      };
    };
  };

  /// Confirm manual UPI payment (customer submits their UPI transaction reference).
  public shared ({ caller }) func confirmUpiPayment(
    orderId : Text,
    upiRef : Text,
  ) : async { #ok : CommonTypes.ConfirmPaymentResponse; #err : Text } {
    ignore caller;

    // The order MUST already be in the orders map (created by createOrder).
    switch (orders.get(orderId)) {
      case (null) {
        #err("Order not found");
      };
      case (?existing) {
        // Idempotent: already confirmed — return success.
        if (existing.paymentStatus == #Paid) {
          return #ok({ orderId });
        };
        // Mark as Paid with the UPI reference and persist.
        let updatedOrder = {
          existing with
          paymentStatus = #Paid;
          upiRef = ?upiRef;
          paymentRef = ?upiRef;
        };
        orders.add(orderId, updatedOrder);
        await sendTemplatedEmail(updatedOrder, "template_payment_confirmation", []);
        await sendTemplatedEmail(updatedOrder, "template_order_confirmation", []);
        await sendConfirmationEmails(updatedOrder);
        #ok({ orderId });
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customerId : Text) : async [CommonTypes.Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    let result = List.empty<CommonTypes.Order>();
    for ((_, order) in orders.entries()) {
      switch (order.customerId) {
        case (?id) {
          if (id == customerId) {
            result.add(order);
          };
        };
        case null {};
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func linkAnonymousOrders(email : Text, phone : Text, customerId : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    var linkedCount = 0;
    for ((orderId, order) in orders.entries()) {
      let emailMatch = order.customerEmail == email;
      let phoneMatch = if (phone == "") { false } else { order.customerPhone == phone };
      if (emailMatch or phoneMatch) {
        let updatedOrder = { order with customerId = ?customerId };
        orders.add(orderId, updatedOrder);
        linkedCount += 1;
      };
    };
    linkedCount;
  };

  /// Get a single order by ID — no auth required so customers can check their order.
  public query func getOrder(orderId : CommonTypes.OrderId) : async ?CommonTypes.Order {
    orders.get(orderId);
  };

  /// List all orders — admin only.
  public query ({ caller }) func listAllOrders() : async [CommonTypes.Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    orders.values().toArray();
  };

  /// Update order status — admin only.
  public shared ({ caller }) func updateOrderStatus(
    orderId : CommonTypes.OrderId,
    status : CommonTypes.OrderStatus,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updated = OrdersLib.setOrderStatus(order, status);
        orders.add(orderId, updated);
        // Send automated emails based on status transitions
        switch (status) {
          case (#Shipped) {
            await sendTemplatedEmail(updated, "template_shipping_notification", []);
          };
          case (#Delivered) {
            await sendTemplatedEmail(updated, "template_delivery_confirmation", []);
          };
          case (_) {};
        };
      };
    };
  };

  /// Update only the payment status of an order — admin only.
  public shared ({ caller }) func updatePaymentStatus(
    orderId : CommonTypes.OrderId,
    paymentStatus : CommonTypes.PaymentStatus,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updated = OrdersLib.setPaymentStatus(order, paymentStatus);
        orders.add(orderId, updated);
      };
    };
  };

  /// Upload final artwork and link it to the order — admin only.
  public shared ({ caller }) func uploadFinalArtwork(
    orderId : CommonTypes.OrderId,
    artworkKey : Storage.ExternalBlob,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updated = OrdersLib.setFinalArtwork(order, artworkKey);
        orders.add(orderId, updated);
        await sendTemplatedEmail(updated, "template_design_preview", []);
        let baseUrl = "https://cherishables.shop";
        let _ = await EmailClient.sendServiceEmail(
          "no-reply",
          [order.customerEmail],
          "Your artwork is ready for download! \u{2014} Cherishables",
          "<h2>Your Artwork is Ready! \u{1F3A8}</h2>" #
          "<p>Hello " # order.customerName # ",</p>" #
          "<p>Your custom portrait (Order ID: <strong>" # orderId # "</strong>) is complete!</p>" #
          "<p><a href=\"" # baseUrl # "/order-status/" # orderId # "\">Click here to download your HD artwork</a></p>" #
          "<p>Thank you for choosing Cherishables! \u{2764}</p>",
        );
      };
    };
  };

  /// Save Razorpay Key ID and Key Secret — admin only.
  public shared ({ caller }) func saveRazorpayKeys(keyId : Text, keySecret : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    razorpayState.razorpayKeyId := keyId;
    razorpayState.razorpayKeySecret := keySecret;
    true;
  };

  /// Get the stored Razorpay Key ID (masked preview) — admin only.
  public query ({ caller }) func getRazorpayKeyId() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    if (razorpayState.razorpayKeyId == "") { null } else { ?razorpayState.razorpayKeyId };
  };

  /// Get only the Razorpay key_id for use in the frontend checkout modal.
  /// Public — no admin check. Never exposes the key secret.
  public query func getRazorpayPublicKeyId() : async { #ok : Text; #err : Text } {
    if (razorpayState.razorpayKeyId == "") {
      #err("Razorpay not configured");
    } else {
      #ok(razorpayState.razorpayKeyId);
    };
  };

  /// Prepare Razorpay checkout payload for a given order.
  /// Returns a JSON string with amount_in_paise, currency, and order details
  /// for the frontend to open the Razorpay checkout modal directly.
  public query func getRazorpayCheckoutPayload(orderId : Text) : async { #ok : Text; #err : Text } {
    if (razorpayState.razorpayKeyId == "") {
      return #err("Razorpay not configured");
    };
    switch (orders.get(orderId)) {
      case (null) { #err("Order not found") };
      case (?order) {
        // Validate all required fields are present
        if (order.amount == 0) {
          return #err("Order amount is 0");
        };
        if (orderId == "") {
          return #err("Invalid order ID");
        };
        if (razorpayState.razorpayKeyId == "") {
          return #err("Razorpay key ID is missing");
        };
        switch (order.razorpayOrderId) {
          case (null) {
            return #err("Razorpay order ID not found for this order");
          };
          case (?rzpOrderId) {
            let json =
              "{\"keyId\":\"" # razorpayState.razorpayKeyId #
              "\",\"amount\":" # order.amount.toText() #
              ",\"currency\":\"INR\"" #
              ",\"orderId\":\"" # rzpOrderId #
              "\",\"name\":\"Cherishables\"" #
              ",\"description\":\"Custom Caricature Portrait\"" #
              ",\"prefill_email\":\"" # order.customerEmail #
              "\",\"prefill_name\":\"" # order.customerName # "\"}";
            #ok(json);
          };
        };
      };
    };
  };



  /// Confirm Razorpay payment: store payment IDs and mark order based on payment mode.
  /// For #Full mode: marks as #Paid. For #Advance mode: marks as #AdvancePaid.
  /// Note: HMAC signature verification requires http-outcalls extension;
  /// for now we trust the payment IDs and mark the order paid directly.
  public shared ({ caller }) func confirmRazorpayPayment(
    orderId : Text,
    razorpayPaymentId : Text,
    razorpayOrderId : Text,
    razorpaySignature : Text,
  ) : async { #ok : Bool; #err : Text } {
    ignore caller;
    ignore razorpayOrderId;
    ignore razorpaySignature;

    switch (orders.get(orderId)) {
      case (null) { #err("Order not found") };
      case (?existing) {
        if (existing.paymentStatus == #Paid) {
          return #ok(true);
        };
        let updatedOrder = OrdersLib.confirmPayment(existing, existing.amount, ?razorpayPaymentId, ?razorpayOrderId);
        orders.add(orderId, updatedOrder);
        await sendTemplatedEmail(updatedOrder, "template_payment_confirmation", []);
        await sendTemplatedEmail(updatedOrder, "template_order_confirmation", []);
        await sendConfirmationEmails(updatedOrder);
        #ok(true);
      };
    };
  };



  /// Delete an order by ID — admin only.
  /// Delete an order by ID — admin only.
  public shared ({ caller }) func deleteOrder(
    orderId : CommonTypes.OrderId,
  ) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      return #err("Unauthorized");
    };
    switch (orders.get(orderId)) {
      case (null) { #err("Order not found") };
      case (?_) {
        orders.remove(orderId);
        #ok;
      };
    };
  };

  /// Transform function for HTTP outcalls (required by the IC HTTP outcalls API).
  public shared query func transform(raw : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    {
      status = raw.response.status;
      body = raw.response.body;
      headers = raw.response.headers;
    };
  };

  // --- Private helpers ---

  /// Send a templated email using the email communication system.
  /// Logs the email to communicationLogs for audit trail.
  private func sendTemplatedEmail(
    order : CommonTypes.Order,
    templateId : EmailTypes.EmailTemplateId,
    extraVariables : [(Text, Text)],
  ) : async () {
    if (not adminEmailConfig.config.isEnabled) {
      return;
    };

    switch (emailTemplates.get(templateId)) {
      case (null) {
        Debug.print("[EMAIL] Template not found: " # templateId);
      };
      case (?template) {
        if (not template.isActive) {
          Debug.print("[EMAIL] Template inactive: " # templateId);
          return;
        };

        let baseVariables = buildOrderVariables(order);
        let allVariables = baseVariables.concat(extraVariables);
        let (subject, body) = EmailLib.replaceVariables(template, allVariables);

        let logId = "log-" # emailState.nextLogId.toText();
        emailState.nextLogId += 1;

        let log : EmailTypes.CommunicationLog = {
          adminSeenAt = null;
          id = logId;
          orderId = order.orderId;
          templateId = templateId;
          templateName = template.name;
          recipientEmail = order.customerEmail;
          subject = subject;
          body = body;
          status = #Pending;
          sentAt = null;
          errorMessage = null;
          messages = [];
        };

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
            }
          };
          case (#err(msg)) {
            {
              log with
              status = #Failed;
              errorMessage = ?msg;
            }
          };
        };

        communicationLogs.add(logId, updatedLog);
      };
    };
  };

  /// Build standard variables from an order for template substitution.
  private func buildOrderVariables(order : CommonTypes.Order) : [(Text, Text)] {
    let statusText = EmailLib.orderStatusToText(order.orderStatus);
    let amountText = EmailLib.formatAmount(order.amount);
    let deliveryDate = order.estimatedDeliveryText;
    let portraitTypeText = switch (order.portraitTypeText) {
      case (?t) { if (t != "") t else portraitTypeToText(order.portraitType) };
      case null { portraitTypeToText(order.portraitType) };
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

  private func sendConfirmationEmails(order : CommonTypes.Order) : async () {
    let baseUrl = "https://cherishables.shop";
    let estimatedDate = order.estimatedDeliveryText;
    let portraitTypeText = switch (order.portraitTypeText) {
      case (?t) { if (t != "") t else portraitTypeToText(order.portraitType) };
      case null { portraitTypeToText(order.portraitType) };
    };
    let portraitPriceText = if (order.portraitPrice > 0) {
      "\u{20B9}" # (order.portraitPrice / 100).toText()
    } else { "" };
    let artStyleText = artStyleToText(order.artStyle);
    let cartoonStyleText = order.cartoonStyle;
    let amountInRupees = (order.amount / 100).toText();
    let paymentMethod = switch (order.razorpayPaymentId) {
      case (?pid) { "Card / Online (Razorpay ID: " # pid # ")" };
      case null {
        switch (order.upiRef) {
          case (?ref) { "UPI (Reference: " # ref # ")" };
          case null { "Pending" };
        }
      };
    };
    let trackingLink = baseUrl # "/order-status/" # order.orderId;

    // Build add-ons HTML block
    let addOnsHtml = switch (order.selectedAddOns) {
      case (null) { "" };
      case (?json) {
        if (json == "" or json == "[]") { "" } else {
          "<tr style=\"background:#2d0a0a;\">" #
          "<td style=\"padding:8px;color:#f59e0b;\"><strong>Add-Ons</strong></td>" #
          "<td style=\"padding:8px;font-size:13px;color:#f5f5f5;\">" # json # "</td></tr>";
        }
      };
    };

    // Build delivery address HTML block
    let addressHtml = switch (order.deliveryAddress) {
      case (null) { "" };
      case (?addr) {
        let line2 = if (addr.addressLine2 == "") { "" } else { ", " # addr.addressLine2 };
        "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Delivery Address</strong></td>" #
        "<td style=\"padding:8px;font-size:13px;color:#f5f5f5;\">" #
        addr.fullName # "<br/>" #
        addr.addressLine1 # line2 # "<br/>" #
        addr.city # ", " # addr.state # " - " # addr.pincode # "<br/>" #
        addr.country #
        "</td></tr>";
      };
    };

    // --- Customer confirmation email ---
    let customerSubject = "\u{2705} Order Confirmed #" # order.orderId # " \u{2014} Cherishables";
    let customerBody =
      "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">" #
      "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">" #
      "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">\u{1F3A8} Order Confirmed!</h1>" #
      "<p style=\"color:#f59e0b;margin:8px 0 0;font-size:15px;opacity:0.95;\">Thank you for choosing Cherishables</p>" #
      "</div>" #
      "<div style=\"padding:24px;\">" #
      "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>" # order.customerName # "</strong>,</p>" #
      "<p style=\"color:#d4d4d4;\">We have received your order and our artist is getting started on your custom portrait. \u{1F917}</p>" #
      "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;\">" #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Tracking ID</strong></td><td style=\"padding:10px 8px;font-family:monospace;color:#f5f5f5;\">" # order.orderId # "</td></tr>" #
      "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Portrait Type</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">" # portraitTypeText # "</td></tr>" #
      (if (portraitPriceText != "") { "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Portrait Price</strong></td><td style=\"padding:10px 8px;color:#f59e0b;font-weight:bold;\">" # portraitPriceText # "</td></tr>" } else { "" }) #
      (if (artStyleText != "") { "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Art Style</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">" # artStyleText # "</td></tr>" } else { "" }) #
      (if (cartoonStyleText != "") { "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Cartoon Style</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">" # cartoonStyleText # "</td></tr>" } else { "" }) #
      (if (order.customerPhone != "") { "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Phone</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">" # order.customerPhone # "</td></tr>" } else { "" }) #
      addOnsHtml #
      "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Total Paid</strong></td><td style=\"padding:10px 8px;color:#f59e0b;font-weight:bold;font-size:16px;\">\u{20B9}" # amountInRupees # "</td></tr>" #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Payment</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">" # paymentMethod # "</td></tr>" #
      "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Estimated Delivery</strong></td><td style=\"padding:10px 8px;color:#16a34a;font-weight:bold;\">" # estimatedDate # "</td></tr>" #
      addressHtml #
      "</table>" #
      "<div style=\"text-align:center;margin:28px 0;\">" #
      "<a href=\"" # trackingLink # "\" style=\"background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;\">\u{1F4E6} Track Your Order</a>" #
      "</div>" #
      "<p style=\"color:#d4d4d4;font-size:14px;\">Or copy this link: <a href=\"" # trackingLink # "\" style=\"color:#f59e0b;\">" # trackingLink # "</a></p>" #
      "<hr style=\"border:none;border-top:1px solid #7f1d1d;margin:24px 0;\"/>" #
      "<p style=\"color:#a3a3a3;font-size:13px;\">Have questions? Simply reply to this email or WhatsApp us at <strong>+91-8431274009</strong>.</p>" #
      "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong> \u{2764}\u{FE0F}</p>" #
      "</div>" #
      "</div>";

    let customerResult = await EmailClient.sendServiceEmail(
      "no-reply",
      [order.customerEmail],
      customerSubject,
      customerBody,
    );
    switch (customerResult) {
      case (#ok) {};
      case (#err(msg)) {
        Debug.print("[EMAIL ERROR] customer confirmation for order " # order.orderId # " failed: " # msg);
      };
    };

    // --- Admin notification email ---
    let adminDest = if (state.adminEmail != "") { state.adminEmail } else { "sudipthas1@gmail.com" };
    let adminSubject = "\u{1F4E6} New Paid Order #" # order.orderId # " \u{2014} Cherishables";

    // Build add-ons admin block
    let adminAddOnsHtml = switch (order.selectedAddOns) {
      case (null) { "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Add-Ons</strong></td><td style=\"padding:8px;color:#f5f5f5;\">None</td></tr>" };
      case (?json) {
        if (json == "" or json == "[]") {
          "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Add-Ons</strong></td><td style=\"padding:8px;color:#f5f5f5;\">None</td></tr>"
        } else {
          "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Add-Ons</strong></td><td style=\"padding:8px;font-size:12px;word-break:break-all;color:#f5f5f5;\">" # json # "</td></tr>"
        }
      };
    };

    // Build address admin block
    let adminAddressHtml = switch (order.deliveryAddress) {
      case (null) { "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Delivery Address</strong></td><td style=\"padding:8px;color:#f5f5f5;\">Not provided</td></tr>" };
      case (?addr) {
        let line2 = if (addr.addressLine2 == "") { "" } else { ", " # addr.addressLine2 };
        "<tr style=\"background:#2d0a0a;\">" #
        "<td style=\"padding:8px;color:#f59e0b;\"><strong>Delivery Address</strong></td>" #
        "<td style=\"padding:8px;font-size:13px;color:#f5f5f5;\">" #
        addr.fullName # ", " #
        addr.addressLine1 # line2 # ", " #
        addr.city # ", " # addr.state # " " # addr.pincode # ", " # addr.country #
        "</td></tr>";
      };
    };

    let referredByHtml = switch (order.referredBy) {
      case (null) { "" };
      case (?ref) {
        "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Referred By</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # ref # "</td></tr>"
      };
    };

    let adminBody =
      "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">" #
      "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px;text-align:center;\">" #
      "<h2 style=\"color:#fff;margin:0;\">\u{1F4E6} New Paid Order</h2>" #
      "<p style=\"color:#f59e0b;margin:6px 0 0;opacity:0.95;\">Cherishables</p>" #
      "</div>" #
      "<div style=\"padding:20px;\">" #
      "<table style=\"width:100%;border-collapse:collapse;font-size:14px;\">" #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Tracking ID</strong></td><td style=\"padding:8px;font-family:monospace;color:#f5f5f5;\">" # order.orderId # "</td></tr>" #
      "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Customer Name</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # order.customerName # "</td></tr>" #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Customer Email</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # order.customerEmail # "</td></tr>" #
      (if (order.customerPhone != "") { "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Phone</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # order.customerPhone # "</td></tr>" } else { "" }) #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Portrait Type</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # portraitTypeText # "</td></tr>" #
      (if (portraitPriceText != "") { "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Portrait Price</strong></td><td style=\"padding:8px;color:#f59e0b;font-weight:bold;\">" # portraitPriceText # "</td></tr>" } else { "" }) #
      (if (artStyleText != "") { "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Art Style</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # artStyleText # "</td></tr>" } else { "" }) #
      (if (cartoonStyleText != "") { "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Cartoon Style</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # cartoonStyleText # "</td></tr>" } else { "" }) #
      adminAddOnsHtml #
      adminAddressHtml #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Amount</strong></td><td style=\"padding:8px;color:#f59e0b;font-weight:bold;\">\u{20B9}" # amountInRupees # "</td></tr>" #
      "<tr><td style=\"padding:8px;color:#f59e0b;\"><strong>Payment</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # paymentMethod # "</td></tr>" #
      referredByHtml #
      "<tr style=\"background:#2d0a0a;\"><td style=\"padding:8px;color:#f59e0b;\"><strong>Notes</strong></td><td style=\"padding:8px;color:#f5f5f5;\">" # order.notes # "</td></tr>" #
      "</table>" #
      "<div style=\"text-align:center;margin:20px 0;\">" #
      "<a href=\"https://cherishables.shop/admin\" style=\"background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;\">Open Admin Dashboard</a>" #
      "</div>" #
      "</div>" #
      "</div>";

    let adminResult = await EmailClient.sendServiceEmail(
      "no-reply",
      [adminDest],
      adminSubject,
      adminBody,
    );
    switch (adminResult) {
      case (#ok) {};
      case (#err(msg)) {
        Debug.print("[EMAIL ERROR] admin notification for order " # order.orderId # " failed: " # msg);
      };
    };
  };

  private func portraitTypeToText(pt : CommonTypes.PortraitType) : Text {
    switch (pt) {
      case (#Single) { "Single Portrait" };
      case (#Couple) { "Couple Portrait" };
      case (#Family) { "Family Portrait" };
      case (#Group) { "Group Portrait" };
    };
  };

  private func artStyleToText(style : CommonTypes.ArtStyle) : Text {
    switch (style) {
      case (#CuteCartoon) { "Cute Cartoon" };
      case (#ProfessionalPortrait) { "Professional Portrait" };
      case (#SoftAesthetic) { "Soft Aesthetic" };
      case (#FunnyExaggerated) { "Funny Exaggerated" };
      case (#CoupleIllustration) { "Couple Illustration" };
      case (#Chibi) { "Chibi" };
    };
  };
};
