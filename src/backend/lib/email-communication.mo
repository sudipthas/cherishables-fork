import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import EmailTypes "../types/email-communication";
import CommonTypes "../types/common";

module {
  public type EmailTemplate = EmailTypes.EmailTemplate;
  public type CommunicationLog = EmailTypes.CommunicationLog;
  public type AdminEmailConfig = EmailTypes.AdminEmailConfig;
  public type EmailStatus = EmailTypes.EmailStatus;

  public func defaultAdminEmailConfig() : AdminEmailConfig {
    {
      adminEmail = "orders@cherishables.in";
      fromName = "Cherishables";
      isEnabled = true;
      replyTo = "orders@cherishables.in";
    }
  };

  public func getReplyTo(config : AdminEmailConfig) : Text {
    if (config.replyTo != "") { config.replyTo } else { config.adminEmail }
  };

  public func getDefaultTemplates() : [EmailTemplate] {
    return [
    {
      id = "template_payment_reminder";
      name = "Payment Reminder";
      subject = "Payment Reminder for Order #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Payment Reminder</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">We noticed that payment for your order <strong>{{orderId}}</strong> is still pending.</p>"
        # "<p style=\"color:#d4d4d4;\">To avoid any delay in processing your custom artwork, please complete your payment at the earliest.</p>"
        # "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;\">"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Order ID</strong></td><td style=\"padding:10px 8px;font-family:monospace;color:#f5f5f5;\">{{orderId}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Product</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">{{productName}}</td></tr>"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Total Amount</strong></td><td style=\"padding:10px 8px;color:#f59e0b;font-weight:bold;\">{{totalAmount}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Payment Method</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">{{paymentMethod}}</td></tr>"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Days Pending</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">{{daysPending}}</td></tr>"
        # "</table>"
        # "<div style=\"text-align:center;margin:28px 0;\">"
        # "<a href=\"{{paymentUrl}}\" style=\"background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;\">Pay Now</a>"
        # "</div>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">If you have already completed the payment, please ignore this email or contact us at <strong>orders@cherishables.in</strong>.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId", "totalAmount", "productName", "paymentUrl", "paymentMethod", "daysPending"];
      category = "Payment";
      isActive = true;
    },
    {
      id = "template_order_confirmation";
      name = "Order Confirmation";
      subject = "Order Confirmed #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Order Confirmed!</h1>"
        # "<p style=\"color:#f59e0b;margin:8px 0 0;font-size:15px;opacity:0.95;\">Thank you for choosing Cherishables</p>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">We have received your order and our artist is getting started on your custom portrait.</p>"
        # "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;\">"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Tracking ID</strong></td><td style=\"padding:10px 8px;font-family:monospace;color:#f5f5f5;\">{{orderId}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Status</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">{{status}}</td></tr>"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Total Amount</strong></td><td style=\"padding:10px 8px;color:#f59e0b;font-weight:bold;\">{{totalAmount}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Estimated Delivery</strong></td><td style=\"padding:10px 8px;color:#16a34a;font-weight:bold;\">{{deliveryDate}}</td></tr>"
        # "</table>"
        # "<div style=\"text-align:center;margin:28px 0;\">"
        # "<a href=\"https://cherishables.shop/order-status/{{orderId}}\" style=\"background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;\">Track Your Order</a>"
        # "</div>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">Have questions? Simply reply to this email or WhatsApp us at <strong>+91-8431274009</strong>.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId", "status", "totalAmount", "deliveryDate"];
      category = "Order";
      isActive = true;
    },
    {
      id = "template_payment_confirmation";
      name = "Payment Confirmation";
      subject = "Payment Received #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Payment Received!</h1>"
        # "<p style=\"color:#f59e0b;margin:8px 0 0;font-size:15px;opacity:0.95;\">Thank you for your payment</p>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">We have received your payment for order <strong>{{orderId}}</strong>.</p>"
        # "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;\">"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Tracking ID</strong></td><td style=\"padding:10px 8px;font-family:monospace;color:#f5f5f5;\">{{orderId}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Amount Paid</strong></td><td style=\"padding:10px 8px;color:#f5f5f5;\">{{totalAmount}}</td></tr>"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Status</strong></td><td style=\"padding:10px 8px;color:#16a34a;font-weight:bold;\">{{status}}</td></tr>"
        # "</table>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId", "status", "totalAmount"];
      category = "Payment";
      isActive = true;
    },
    {
      id = "template_design_preview";
      name = "Design Preview";
      subject = "Your Design Preview is Ready #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Design Preview Ready!</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">Your design preview for order <strong>{{orderId}}</strong> is ready for review.</p>"
        # "<p style=\"color:#d4d4d4;\">Please review the preview and let us know if you need any revisions.</p>"
        # "<div style=\"text-align:center;margin:28px 0;\">"
        # "<a href=\"https://cherishables.shop/order-status/{{orderId}}\" style=\"background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;\">View Preview</a>"
        # "</div>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId"];
      category = "Design";
      isActive = true;
    },
    {
      id = "template_revision_request";
      name = "Revision Request";
      subject = "Revision Request for Order #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Revision Request</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">We have received your revision request for order <strong>{{orderId}}</strong>.</p>"
        # "<p style=\"color:#d4d4d4;\">Our artist will make the requested changes and send you an updated preview shortly.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId"];
      category = "Design";
      isActive = true;
    },
    {
      id = "template_production_update";
      name = "Production Update";
      subject = "Production Update for Order #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Production Update</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">Your order <strong>{{orderId}}</strong> is now in production.</p>"
        # "<p style=\"color:#d4d4d4;\">Status: <strong>{{status}}</strong></p>"
        # "<p style=\"color:#d4d4d4;\">Products: {{productNames}}</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId", "status", "productNames"];
      category = "Production";
      isActive = true;
    },
    {
      id = "template_shipping_notification";
      name = "Shipping Notification";
      subject = "Your Order Has Shipped #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Order Shipped!</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">Great news! Your order <strong>{{orderId}}</strong> has been shipped.</p>"
        # "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;\">"
        # "<tr style=\"background:#2d0a0a;\"><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Tracking ID</strong></td><td style=\"padding:10px 8px;font-family:monospace;color:#f5f5f5;\">{{trackingId}}</td></tr>"
        # "<tr><td style=\"padding:10px 8px;color:#f59e0b;\"><strong>Status</strong></td><td style=\"padding:10px 8px;color:#16a34a;font-weight:bold;\">{{status}}</td></tr>"
        # "</table>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId", "trackingId", "status"];
      category = "Shipping";
      isActive = true;
    },
    {
      id = "template_delivery_confirmation";
      name = "Delivery Confirmation";
      subject = "Order Delivered #{{orderId}} — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Order Delivered!</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">Your order <strong>{{orderId}}</strong> has been delivered.</p>"
        # "<p style=\"color:#d4d4d4;\">We hope you love your custom artwork! Please share your feedback with us.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;margin-top:16px;border-top:1px solid #7f1d1d;padding-top:12px;\"><strong>Reply to this email</strong> to continue the conversation. Your reply will be added to your order thread.</p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId"];
      category = "Delivery";
      isActive = true;
    },
    {
      id = "template_customer_support";
      name = "Customer Support";
      subject = "Customer Support — Cherishables";
      body = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a0000;border-radius:12px;overflow:hidden;border:1px solid #7f1d1d;\">"
        # "<div style=\"background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;\">"
        # "<h1 style=\"color:#fff;margin:0;font-size:26px;letter-spacing:0.5px;\">Customer Support</h1>"
        # "</div>"
        # "<div style=\"padding:24px;\">"
        # "<p style=\"font-size:16px;color:#f5f5f5;\">Hello <strong>{{customerName}}</strong>,</p>"
        # "<p style=\"color:#d4d4d4;\">Thank you for reaching out to us regarding order <strong>{{orderId}}</strong>.</p>"
        # "<p style=\"color:#d4d4d4;\">We have received your inquiry and will get back to you shortly.</p>"
        # "<p style=\"color:#a3a3a3;font-size:13px;\">With love, <strong>Cherishables</strong></p>"
        # "</div>"
        # "</div>";
      variables = ["customerName", "orderId"];
      category = "Support";
      isActive = true;
    },
    ];
  };

  public func replaceVariables(template : EmailTemplate, variables : [(Text, Text)]) : (Text, Text) {
    var subject = template.subject;
    var body = template.body;
    for ((key, value) in variables.vals()) {
      let placeholder = "{{" # key # "}}";
      subject := subject.replace(#text(placeholder), value);
      body := body.replace(#text(placeholder), value);
    };
    (subject, body)
  };

  public func orderStatusToText(status : CommonTypes.OrderStatus) : Text {
    switch (status) {
      case (#Received) { "Received" };
      case (#InProgress) { "In Progress" };
      case (#Shipped) { "Shipped" };
      case (#OutForDelivery) { "Out for Delivery" };
      case (#Completed) { "Completed" };
      case (#Delivered) { "Delivered" };
    };
  };

  public func createLog(
    logId : Text,
    orderId : Text,
    templateId : EmailTypes.EmailTemplateId,
    templateName : Text,
    recipientEmail : Text,
    subject : Text,
    body : Text,
    status : EmailTypes.EmailStatus,
    sentAt : ?Int,
    errorMessage : ?Text,
  ) : EmailTypes.CommunicationLog {
    let initialMessage : EmailTypes.CommunicationMessage = {
      isRead = false;
      direction = #Sent;
      body = body;
      timestamp = switch (sentAt) { case (?t) { t }; case null { 0 } };
      author = null;
    };
    {
      id = logId;
      orderId = orderId;
      templateId = templateId;
      templateName = templateName;
      recipientEmail = recipientEmail;
      subject = subject;
      body = body;
      status = status;
      sentAt = sentAt;
      errorMessage = errorMessage;
      messages = [initialMessage];
      adminSeenAt = null;
    }
  };

  public func formatAmount(amount : Nat) : Text {
    "\u{20B9}" # (amount / 100).toText()
  }
}
