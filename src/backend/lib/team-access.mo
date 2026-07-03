import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import TeamTypes "../types/team-access";

module {
  /// Create a new sales-rep allowlist entry.
  /// `email`, `name`, and `phone` are optional — a rep may be invited by
  /// email before they have logged in with a principal, and existing reps
  /// that predate the name/phone fields deserialize as `null`.
  public func createSalesRep(
    principalText : Text,
    email : ?Text,
    name : ?Text,
    phone : ?Text,
  ) : TeamTypes.SalesRep {
    {
      principal = principalText;
      email;
      name;
      phone;
      addedAt = Time.now();
    };
  };

  /// Check whether a given principal text is on the allowlist.
  public func isSalesRep(
    salesReps : Map.Map<Text, TeamTypes.SalesRep>,
    principalText : Text,
  ) : Bool {
    salesReps.get(principalText) != null;
  };

  /// Return all sales reps as an array (no particular order guaranteed).
  public func listAll(salesReps : Map.Map<Text, TeamTypes.SalesRep>) : TeamTypes.SalesRepList {
    salesReps.values().toArray();
  };

  /// Normalize a Principal to its Text form for allowlist keying.
  public func toText(p : Principal) : Text {
    p.toText();
  };
};
