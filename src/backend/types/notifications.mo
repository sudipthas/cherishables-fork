import Time "mo:core/Time";
import CommonTypes "./common";

module NotificationTypes {
  public type NotificationType = {
    #Order;
    #Message;
  };

  public type Notification = {
    id : Text;
    notificationType : NotificationType;
    title : Text;
    message : Text;
    timestamp : Int;
    isRead : Bool;
    link : ?Text;
    orderId : ?Text;
    logId : ?Text;
  };
}
