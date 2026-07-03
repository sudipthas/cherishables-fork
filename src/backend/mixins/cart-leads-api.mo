import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CartLeadLib "../lib/cart-leads";

mixin (
  accessControlState : AccessControl.AccessControlState,
  cartLeads : Map.Map<Nat, CartLeadLib.CartLead>,
  cartLeadsState : { var nextCartLeadId : Nat },
) {

  /// Save a cart lead — no authentication required, callable by any visitor.
  public shared ({ caller }) func saveCartLead(input : CartLeadLib.CartLeadInput) : async { #ok : Nat; #err : Text } {
    ignore caller;
    cartLeadsState.nextCartLeadId += 1;
    let id = cartLeadsState.nextCartLeadId;
    let lead = CartLeadLib.create(input, id);
    cartLeads.add(id, lead);
    #ok(id);
  };

  /// Save a checkout lead — no authentication required, callable by any visitor.
  public shared ({ caller }) func saveCheckoutLead(input : CartLeadLib.CheckoutLeadInput) : async { #ok : Nat; #err : Text } {
    ignore caller;
    cartLeadsState.nextCartLeadId += 1;
    let id = cartLeadsState.nextCartLeadId;
    let lead = CartLeadLib.createCheckout(input, id);
    cartLeads.add(id, lead);
    #ok(id);
  };

  /// Save a browse lead — no authentication required, callable by any visitor.
  public shared ({ caller }) func saveBrowseLead(input : CartLeadLib.BrowseLeadInput) : async { #ok : Nat; #err : Text } {
    ignore caller;
    cartLeadsState.nextCartLeadId += 1;
    let id = cartLeadsState.nextCartLeadId;
    let lead = CartLeadLib.createBrowse(input, id);
    cartLeads.add(id, lead);
    #ok(id);
  };

  /// List all cart leads — admin only.
  public query ({ caller }) func getCartLeads() : async [CartLeadLib.CartLead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    CartLeadLib.listAll(cartLeads);
  };

  /// Update the status of a cart lead by id — admin only.
  public shared ({ caller }) func updateCartLeadStatus(id : Nat, status : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (cartLeads.get(id)) {
      case null { #err("Cart lead not found: " # id.toText()) };
      case (?lead) {
        cartLeads.add(id, CartLeadLib.updateStatus(lead, status));
        #ok(());
      };
    };
  };

  /// Delete a cart lead by id — admin only.
  public shared ({ caller }) func deleteCartLead(id : Nat) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (cartLeads.get(id)) {
      case null { #err("Cart lead not found: " # id.toText()) };
      case (?_lead) {
        cartLeads.remove(id);
        #ok(());
      };
    };
  };
};
