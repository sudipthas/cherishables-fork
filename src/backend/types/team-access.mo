module {
  /// A sales-rep entry on the founder-managed allowlist.
  /// `principal` is stored as Text so it can be returned to the admin UI
  /// without leaking the Principal type across the candid boundary in
  /// free-form admin tooling.
  /// `email` is optional so reps can be invited by email before they have
  /// logged in with a principal; existing reps without an email deserialize
  /// as `null`.
  /// `name` and `phone` are optional so existing reps that predate these
  /// fields deserialize as `null` (backward compatibility). Admins record a
  /// rep's display name (for the assignment dropdown and Team Portal
  /// read-only display) and phone number (for the click-to-call tel: link).
  public type SalesRep = {
    principal : Text;
    email : ?Text;
    name : ?Text;
    phone : ?Text;
    addedAt : Int;
  };

  /// Result shape returned by `listSalesReps()`.
  public type SalesRepList = [SalesRep];

  /// Local permission variant used by the team-scoped endpoints.
  /// The authorization extension's `UserRole` only defines `#admin`,
  /// so the team domain keeps its own permission vocabulary for the
  /// `#founder` and `#salesRep` concepts. The founder is the existing
  /// admin principal; sales reps are entries on the allowlist.
  public type TeamPermission = {
    #founder;
    #salesRep;
  };
};
