import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import AccessControl "mo:caffeineai-authorization/access-control";
import NotificationTypes "../types/notifications";
import CommonTypes "../types/common";
import EmailTypes "../types/email-communication";
import Runtime "mo:core/Runtime";

mixin(accessControlState : AccessControl.AccessControlState, orders : Map.Map<Text, CommonTypes.Order>, communicationLogs : Map.Map<Text, EmailTypes.CommunicationLog>) {

  public query ({ caller }) func getUnreadOrdersCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    var count = 0;
    for ((_, order) in orders.entries()) {
      if (not order.isRead) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getUnreadMessagesCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    var count = 0;
    for ((_, log) in communicationLogs.entries()) {
      for (msg in log.messages.vals()) {
        if (not msg.isRead and msg.direction == #Received) {
          count += 1;
        };
      };
    };
    count;
  };

  public shared ({ caller }) func markOrderAsSeen(orderId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder = { order with isRead = true };
        orders.add(orderId, updatedOrder);
      };
      case null {};
    };
  };

  public shared ({ caller }) func markMessageAsRead(logId : Text, messageIndex : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    switch (communicationLogs.get(logId)) {
      case (?log) {
        if (messageIndex < log.messages.size()) {
          let updatedMessages = List.fromArray<EmailTypes.CommunicationMessage>(log.messages);
          let msg = updatedMessages.at(messageIndex);
          switch (?msg) {
            case (?m) {
              updatedMessages.put(messageIndex, { m with isRead = true });
              let updatedLog = { log with messages = updatedMessages.toArray() };
              communicationLogs.add(logId, updatedLog);
            };
            case null {};
          };
        };
      };
      case null {};
    };
  };

  public shared ({ caller }) func deleteMessage(logId : Text, messageIndex : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    switch (communicationLogs.get(logId)) {
      case (?log) {
        if (messageIndex < log.messages.size()) {
          let updatedMessages = log.messages.filter(func(_msg : EmailTypes.CommunicationMessage) : Bool {
            _msg != log.messages[messageIndex]
          });
          let updatedLog = { log with messages = updatedMessages };
          communicationLogs.add(logId, updatedLog);
        };
      };
      case null {};
    };
  };

  public query ({ caller }) func getRecentNotifications(limit : Nat) : async [NotificationTypes.Notification] {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized: admin only"); };
    let notifications = List.empty<NotificationTypes.Notification>();

    // Add unread orders
    for ((orderId, order) in orders.entries()) {
      if (not order.isRead) {
        let notification : NotificationTypes.Notification = {
          id = "order-" # orderId;
          notificationType = #Order;
          title = "New Order: " # orderId;
          message = "Order from " # order.customerName # " - Rs." # Nat.toText(order.amount / 100);
          timestamp = order.createdAt;
          isRead = false;
          link = ?("/order-status/" # orderId);
          orderId = ?orderId;
          logId = null;
        };
        notifications.add(notification);
      };
    };

    // Add unread messages
    for ((logId, log) in communicationLogs.entries()) {
      var msgIndex = 0;
      for (msg in log.messages.vals()) {
        if (not msg.isRead and msg.direction == #Received) {
          let notification : NotificationTypes.Notification = {
            id = "msg-" # logId # "-" # msgIndex.toText();
            notificationType = #Message;
            title = "New Message";
            message = "Message from " # log.recipientEmail;
            timestamp = msg.timestamp;
            isRead = false;
            link = ?("/admin/communications/" # logId);
            orderId = ?log.orderId;
            logId = ?logId;
          };
          notifications.add(notification);
        };
        msgIndex += 1;
      };
    };

    // Sort by timestamp descending
    let sorted = notifications.toArray();
    let sortedArray = sorted.sort(
      func(a, b) {
        Int.compare(b.timestamp, a.timestamp)
      }
    );

    // Take limit
    let resultSize = if (sortedArray.size() > limit) { limit } else { sortedArray.size() };
    Array.tabulate(resultSize, func(i) { sortedArray[i] });
  };
}
