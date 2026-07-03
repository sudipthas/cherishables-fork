import Time "mo:core/Time";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import CustomerAuthTypes "../types/customer-auth";
import CustomerAuthLib "../lib/customer-auth";
import EmailClient "mo:caffeineai-email/emailClient";
import CommonTypes "../types/common";

mixin (
  customers : Map.Map<CustomerAuthTypes.CustomerId, CustomerAuthTypes.Customer>,
  otps : Map.Map<Text, CustomerAuthTypes.OtpEntry>,
  sessions : Map.Map<Text, CustomerAuthTypes.SessionToken>,
  customerCounter : { var nextCustomerId : Nat },
  _emailClient : module { sendServiceEmail : (Text, [Text], Text, Text) -> async EmailClient.SendResult },
  orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>,
) {

  /// Send OTP to customer's phone via email (using phone as email address for now).
  public func requestOTP(req : CustomerAuthTypes.RequestOtpRequest) : async CustomerAuthTypes.RequestOtpResponse {
    let now = Time.now();
    let otpCode = CustomerAuthLib.generateOTP();
    let otpEntry = CustomerAuthLib.createOtpEntry(otpCode, now);

    // Store OTP keyed by phone
    otps.add(req.phone, otpEntry);

    // Send OTP via email to phone-based address
    let subject = "Your Cherishables Login OTP";
    let body = "Your OTP for login is: " # otpCode # "\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.";

    let emailResult = await _emailClient.sendServiceEmail(
      "no-reply",
      [req.phone],
      subject,
      body,
    );

    switch (emailResult) {
      case (#ok) {
        {
          success = true;
          message = "OTP sent to your phone.";
        };
      };
      case (#err(e)) {
        {
          success = false;
          message = "Failed to send OTP: " # e;
        };
      };
    };
  };

  /// Verify OTP and create session.
  public func verifyOTP(req : CustomerAuthTypes.VerifyOtpRequest) : async CustomerAuthTypes.VerifyOtpResponse {
    let now = Time.now();

    switch (otps.get(req.phone)) {
      case null {
        return {
          success = false;
          token = null;
          customer = null;
          message = "OTP not found. Please request a new OTP.";
        };
      };
      case (?entry) {
        if (not CustomerAuthLib.isOtpValid(entry, req.otp, now)) {
          return {
            success = false;
            token = null;
            customer = null;
            message = "Invalid or expired OTP. Please request a new OTP.";
          };
        };

        // OTP is valid - remove it so it can't be reused
        otps.remove(req.phone);

        // Find or create customer by phone
        let customer = switch (CustomerAuthLib.findCustomerByPhone(customers, req.phone)) {
          case (?existing) {
            // Update name if provided
            let updated = CustomerAuthLib.updateCustomer(existing, req.name, req.phone, now);
            customers.add(updated.id, updated);
            updated;
          };
          case null {
            // Create new customer
            let newId = customerCounter.nextCustomerId;
            customerCounter.nextCustomerId += 1;
            let newCustomer = CustomerAuthLib.createCustomer(newId, req.name, req.email, req.phone, now);
            customers.add(newId, newCustomer);
            newCustomer;
          };
        };

        // Create session
        let session = CustomerAuthLib.generateSessionToken(customer.id, now);
        sessions.add(session.token, session);

        {
          success = true;
          token = ?session.token;
          customer = ?customer;
          message = "Login successful.";
        };
      };
    };
  };

  /// Get current customer from session token.
  public query func getCustomer(token : Text) : async ?CustomerAuthTypes.Customer {
    let now = Time.now();
    switch (CustomerAuthLib.findSessionByToken(sessions, token)) {
      case (?session) {
        if (CustomerAuthLib.isSessionValid(session, now)) {
          CustomerAuthLib.findCustomerById(customers, session.customerId);
        } else {
          null;
        };
      };
      case null { null };
    };
  };

  /// Update customer profile.
  public func updateCustomer(token : Text, req : CustomerAuthTypes.UpdateCustomerRequest) : async CustomerAuthTypes.AuthResult {
    let now = Time.now();
    switch (CustomerAuthLib.findSessionByToken(sessions, token)) {
      case (?session) {
        if (not CustomerAuthLib.isSessionValid(session, now)) {
          return {
            success = false;
            message = "Session expired. Please login again.";
          };
        };
        switch (CustomerAuthLib.findCustomerById(customers, session.customerId)) {
          case (?customer) {
            let updated = CustomerAuthLib.updateCustomer(customer, req.name, req.phone, now);
            customers.add(updated.id, updated);
            {
              success = true;
              message = "Profile updated successfully.";
            };
          };
          case null {
            {
              success = false;
              message = "Customer not found.";
            };
          };
        };
      };
      case null {
        {
          success = false;
          message = "Invalid session. Please login again.";
        };
      };
    };
  };

  /// Logout - invalidate session.
  public func logout(token : Text) : async CustomerAuthTypes.AuthResult {
    sessions.remove(token);
    {
      success = true;
      message = "Logged out successfully.";
    };
  };

  /// Get all customers with order counts (admin only).
  public query func getAllCustomersWithOrders() : async [CustomerAuthTypes.CustomerWithOrders] {
    let allCustomers = CustomerAuthLib.getAllCustomers(customers);
    let result = Map.empty<CustomerAuthTypes.CustomerId, CustomerAuthTypes.CustomerWithOrders>();

    for (customer in allCustomers.vals()) {
      var orderCount = 0;
      for ((_, order) in orders.entries()) {
        switch (order.customerId) {
                case (?cid) { if (cid == customer.id.toText()) { orderCount += 1 } };
          case null {};
        };
      };
      result.add(customer.id, { customer = customer; orderCount = orderCount });
    };

    result.values().toArray();
  };

  /// Get customer count (admin only).
  public query func getCustomerCount() : async Nat {
    CustomerAuthLib.countCustomers(customers);
  };
}
