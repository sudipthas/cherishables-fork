import Map "mo:core/Map";
import Time "mo:core/Time";
import Random "mo:core/Random";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import CustomerAuthTypes "../types/customer-auth";

module {
  public type Customer = CustomerAuthTypes.Customer;
  public type CustomerId = CustomerAuthTypes.CustomerId;
  public type OtpEntry = CustomerAuthTypes.OtpEntry;
  public type SessionToken = CustomerAuthTypes.SessionToken;

  /// Generate a random 6-digit OTP code.
  public func generateOTP() : Text {
    // Use time-based pseudo-random for simplicity
    let now = Time.now();
    let seed = Int.abs(now) % 900000 + 100000;
    seed.toText();
  };

  /// Create a new OTP entry that expires in 10 minutes.
  public func createOtpEntry(code : Text, now : Int) : OtpEntry {
    let tenMinutes = 600_000_000_000; // 10 minutes in nanoseconds
    {
      code = code;
      expiresAt = now + tenMinutes;
      attempts = 0;
    };
  };

  /// Check if OTP is valid (not expired and matches).
  public func isOtpValid(entry : OtpEntry, code : Text, now : Int) : Bool {
    if (now > entry.expiresAt) { return false };
    entry.code == code;
  };

  /// Generate a unique session token.
  public func generateSessionToken(customerId : CustomerId, now : Int) : SessionToken {
    let sevenDays = 604_800_000_000_000; // 7 days in nanoseconds
    let token = "session_" # customerId.toText() # "_" # Int.abs(now).toText();
    {
      token = token;
      customerId = customerId;
      expiresAt = now + sevenDays;
      createdAt = now;
    };
  };

  /// Check if session token is valid.
  public func isSessionValid(session : SessionToken, now : Int) : Bool {
    now <= session.expiresAt;
  };

  /// Create a new customer record.
  public func createCustomer(
    id : CustomerId,
    name : Text,
    email : Text,
    phone : Text,
    now : Int,
  ) : Customer {
    {
      id = id;
      name = name;
      email = email;
      phone = phone;
      createdAt = now;
      updatedAt = now;
    };
  };

  /// Update customer fields.
  public func updateCustomer(
    customer : Customer,
    name : Text,
    phone : Text,
    now : Int,
  ) : Customer {
    {
      id = customer.id;
      name = name;
      email = customer.email;
      phone = phone;
      createdAt = customer.createdAt;
      updatedAt = now;
    };
  };

  /// Find customer by phone in the customers map.
  public func findCustomerByPhone(
    customers : Map.Map<CustomerId, Customer>,
    phone : Text,
  ) : ?Customer {
    for ((_, customer) in customers.entries()) {
      if (customer.phone == phone) { return ?customer };
    };
    null;
  };

  /// Find customer by ID.
  public func findCustomerById(
    customers : Map.Map<CustomerId, Customer>,
    id : CustomerId,
  ) : ?Customer {
    customers.get(id);
  };

  /// Find session by token string.
  public func findSessionByToken(
    sessions : Map.Map<Text, SessionToken>,
    token : Text,
  ) : ?SessionToken {
    sessions.get(token);
  };

  /// Get all customers as an array.
  public func getAllCustomers(customers : Map.Map<CustomerId, Customer>) : [Customer] {
    customers.values().toArray();
  };

  /// Count total customers.
  public func countCustomers(customers : Map.Map<CustomerId, Customer>) : Nat {
    customers.size();
  };
};
