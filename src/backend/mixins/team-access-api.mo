import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import CartLeadLib "../lib/cart-leads";
import TeamTypes "../types/team-access";
import TeamAccessLib "../lib/team-access";

mixin (
  accessControlState : AccessControl.AccessControlState,
  salesReps : Map.Map<Text, TeamTypes.SalesRep>,
  products : Map.Map<Text, CommonTypes.AddonProduct>,
  orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>,
  leads : Map.Map<Text, CommonTypes.Lead>,
  cartLeads : Map.Map<Nat, CartLeadLib.CartLead>,
) {

  // ----------------------------------------------------------------
  // Caller-role queries
  // ----------------------------------------------------------------

  /// Returns true if the caller is the founder (admin) principal.
  public query ({ caller }) func isCallerFounder() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  /// Returns true if the caller is on the sales-rep allowlist OR is the
  /// founder/admin. Used by the /team portal to gate access.
  public query ({ caller }) func isCallerSalesRep() : async Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    TeamAccessLib.isSalesRep(salesReps, caller.toText());
  };

  // ----------------------------------------------------------------
  // Allowlist management — founder/admin only
  // ----------------------------------------------------------------

  /// Add a sales rep to the allowlist by principal text and/or email.
  /// Founder/admin only.
  ///
  /// `name` and `phone` are optional and recorded so the admin UI can
  /// populate the assignment dropdown (name) and the click-to-call tel:
  /// link (phone). Existing reps without name/phone deserialize as `null`.
  ///
  /// Keying strategy:
  /// - If `principal` is non-empty and parses, key the entry by `principal`.
  /// - Otherwise, if `email` is non-empty, key the entry by the email text
  ///   (so the founder can invite by email before the rep has logged in).
  /// - If both are empty, return an error.
  public shared ({ caller }) func addSalesRep(
    principal : Text,
    email : ?Text,
    name : ?Text,
    phone : ?Text,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    // Determine the allowlist key. Prefer a non-empty, parseable principal;
    // fall back to a non-empty email; otherwise reject.
    let key = if (principal != "" and Principal.fromText(principal) != Principal.fromText("")) {
      principal;
    } else {
      switch (email) {
        case (?e) {
          if (e != "") { e } else { return #err("Provide a principal or email") };
        };
        case null { return #err("Provide a principal or email") };
      };
    };
    let rep = TeamAccessLib.createSalesRep(key, email, name, phone);
    salesReps.add(key, rep);
    #ok;
  };

  /// Remove a sales rep from the allowlist by principal text. Founder/admin only.
  public shared ({ caller }) func removeSalesRep(principal : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    switch (salesReps.get(principal)) {
      case null { #err("Sales rep not found: " # principal) };
      case (?_) {
        salesReps.remove(principal);
        #ok;
      };
    };
  };

  /// List all sales reps on the allowlist. Founder/admin only.
  /// Returns the full SalesRep records including `name` and `phone` so the
  /// frontend can populate the assignment dropdown and click-to-call button.
  /// Non-founder callers receive an empty array (matches the admin pattern of
  /// gating reads by permission without trapping).
  public query ({ caller }) func listSalesReps() : async TeamTypes.SalesRepList {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      [];
    } else {
      TeamAccessLib.listAll(salesReps);
    };
  };

  // ----------------------------------------------------------------
  // Lead assignment — founder/admin only
  // ----------------------------------------------------------------

  /// Assign a cart lead to a sales rep by setting the lead's `assignedRep`
  /// field to the rep's principal text. Founder/admin only — this is the
  /// admin-only assignment endpoint. There is intentionally NO team-scoped
  /// assignment endpoint (per the user, assignment is Admin-only).
  /// Returns #err if the caller is unauthorized, the lead is not found, or
  /// the rep is not on the allowlist.
  public shared ({ caller }) func assignLeadToRep(
    cartLeadId : Nat,
    repPrincipal : Text,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    if (not TeamAccessLib.isSalesRep(salesReps, repPrincipal)) {
      return #err("Sales rep not found: " # repPrincipal);
    };
    switch (cartLeads.get(cartLeadId)) {
      case null { #err("Cart lead not found: " # cartLeadId.toText()) };
      case (?lead) {
        cartLeads.add(cartLeadId, CartLeadLib.assignRep(lead, ?repPrincipal));
        #ok;
      };
    };
  };

  // ----------------------------------------------------------------
  // Team-scoped read endpoints — sales rep OR founder
  // ----------------------------------------------------------------

  /// List all products — team view (sales rep OR founder).
  /// Returns the same data as the public listProducts endpoint (sorted by
  /// displayOrder ascending). Non-authorized callers receive an empty array.
  public query ({ caller }) func teamListProducts() : async [CommonTypes.AddonProduct] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return [];
    };
    let all = products.values().toArray();
    all.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };

  /// List all cart leads — team view (sales rep OR founder).
  /// Returns CartLeads.listAll(cartLeads) (sorted by createdAt desc),
  /// including the `assignedRep` field so both portals can display it.
  /// Non-authorized callers receive an empty array.
  public query ({ caller }) func teamListCartLeads() : async [CartLeadLib.CartLead] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return [];
    };
    CartLeadLib.listAll(cartLeads);
  };

  /// List all leads — team view (sales rep OR founder).
  /// Returns the same data as the admin listLeads endpoint.
  /// Non-authorized callers receive an empty array.
  public query ({ caller }) func teamListLeads() : async [CommonTypes.Lead] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return [];
    };
    leads.values().toArray();
  };

  /// List all orders — team view (sales rep OR founder).
  /// Returns the same data as the admin listAllOrders endpoint (sorted by
  /// createdAt desc). Non-authorized callers receive an empty array.
  public query ({ caller }) func teamListOrders() : async [CommonTypes.Order] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return [];
    };
    let all = orders.values().toArray();
    all.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };

  // ----------------------------------------------------------------
  // Team-scoped lead status updates — sales rep OR founder
  // ----------------------------------------------------------------

  /// Update a cart lead's status — team view (sales rep OR founder).
  /// Reuses CartLeads.updateStatus on the matching lead by id.
  public shared ({ caller }) func teamUpdateCartLeadStatus(id : Nat, status : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return #err("Unauthorized: sales rep or admin only");
    };
    switch (cartLeads.get(id)) {
      case null { #err("Cart lead not found: " # id.toText()) };
      case (?lead) {
        cartLeads.add(id, CartLeadLib.updateStatus(lead, status));
        #ok;
      };
    };
  };

  /// Update a lead's status — team view (sales rep OR founder).
  /// Reuses the existing leads update logic (status field on the matching
  /// lead by Text id).
  public shared ({ caller }) func teamUpdateLeadStatus(id : Text, status : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller) and not TeamAccessLib.isSalesRep(salesReps, caller.toText())) {
      return #err("Unauthorized: sales rep or admin only");
    };
    switch (leads.get(id)) {
      case null { #err("Lead not found: " # id) };
      case (?lead) {
        leads.add(id, { lead with status });
        #ok;
      };
    };
  };
};
