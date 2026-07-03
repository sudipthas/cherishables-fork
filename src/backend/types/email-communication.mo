module {
  public type EmailTemplateId = Text;

  public type EmailTemplate = {
    id : EmailTemplateId;
    name : Text;
    subject : Text;
    body : Text;
    variables : [Text];
    category : Text;
    isActive : Bool;
  };

  public type EmailStatus = {
    #Pending;
    #Sent;
    #Failed;
  };

  public type MessageDirection = {
    #Sent;
    #Received;
  };

  public type CommunicationMessage = {
    isRead : Bool;
    direction : MessageDirection;
    body : Text;
    timestamp : Int;
    author : ?Text;
  };

  public type CommunicationLog = {
    adminSeenAt : ?Int;
    id : Text;
    orderId : Text;
    templateId : EmailTemplateId;
    templateName : Text;
    recipientEmail : Text;
    subject : Text;
    body : Text;
    status : EmailStatus;
    sentAt : ?Int;
    errorMessage : ?Text;
    messages : [CommunicationMessage];
  };

  public type AdminEmailConfig = {
    adminEmail : Text;
    fromName : Text;
    isEnabled : Bool;
    replyTo : Text;
  };

  public type SendTemplateEmailRequest = {
    orderId : Text;
    templateId : EmailTemplateId;
    customVariables : [(Text, Text)];
  };

  public type SendTemplateEmailResponse = {
    #ok : CommunicationLog;
    #err : Text;
  };

  public type UpdateAdminEmailConfigRequest = {
    adminEmail : Text;
    fromName : Text;
    isEnabled : Bool;
    replyTo : Text;
  };

  public type AddCustomerReplyPublicRequest = {
    orderId : Text;
    message : Text;
    senderEmail : Text;
  };
}
