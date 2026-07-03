import Time "mo:core/Time";

module {
  /// Unique customer identifier (auto-incrementing counter).
  public type CustomerId = Nat;

  /// Customer record stored in the backend.
  public type Customer = {
    id : CustomerId;
    name : Text;
    email : Text;
    phone : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  /// OTP entry for email/phone verification.
  public type OtpEntry = {
    code : Text;
    expiresAt : Int;
    attempts : Nat;
  };

  /// Session token for authenticated customers.
  public type SessionToken = {
    token : Text;
    customerId : CustomerId;
    expiresAt : Int;
    createdAt : Int;
  };

  /// Request to send OTP to phone.
  public type RequestOtpRequest = {
    phone : Text;
  };

  /// Response from OTP request.
  public type RequestOtpResponse = {
    success : Bool;
    message : Text;
  };

  /// Request to verify OTP and create session.
  public type VerifyOtpRequest = {
    phone : Text;
    otp : Text;
    name : Text;
    email : Text;
  };

  /// Response from OTP verification with session token.
  public type VerifyOtpResponse = {
    success : Bool;
    token : ?Text;
    customer : ?Customer;
    message : Text;
  };

  /// Request to update customer profile.
  public type UpdateCustomerRequest = {
    name : Text;
    phone : Text;
  };

  /// Generic result type for auth operations.
  public type AuthResult = {
    success : Bool;
    message : Text;
  };

  /// Customer with their orders count (for admin view).
  public type CustomerWithOrders = {
    customer : Customer;
    orderCount : Nat;
  };
};
