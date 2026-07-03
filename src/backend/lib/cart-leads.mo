import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Int "mo:core/Int";
import CommonTypes "../types/common";

module {
  public type LeadType = {
    #Checkout;
    #CartAbandon;
    #Browse;
  };

  /// A cart/checkout/browse lead.
  /// `assignedRep` is the principal Text of the sales rep the lead has been
  /// assigned to (admin-only assignment via `assignLeadToRep`). It is
  /// optional so existing leads that predate this field deserialize as
  /// `null` (backward compatibility). Both the admin cart lead listing and
  /// the team `teamListCartLeads` endpoint return this field so both portals
  /// can display the assigned rep.
  public type CartLead = {
    id : Nat;
    name : Text;
    phone : Text;
    email : Text;
    productName : Text;
    productIds : [Text];
    createdAt : Int;
    status : Text;
    leadType : LeadType;
    productInterest : ?Text;
    recipient : ?Text;
    assignedRep : ?Text;
  };

  public type CartLeadInput = {
    name : Text;
    phone : Text;
    email : Text;
    productName : Text;
    productIds : [Text];
    leadType : LeadType;
  };

  public type CheckoutLeadInput = {
    name : Text;
    phone : Text;
    productIds : [Text];
  };

  public type BrowseLeadInput = {
    name : Text;
    phone : Text;
    productInterest : ?Text;
    recipient : ?Text;
  };

  public func create(input : CartLeadInput, id : Nat) : CartLead {
    {
      id;
      name = input.name;
      phone = input.phone;
      email = input.email;
      productName = input.productName;
      productIds = input.productIds;
      createdAt = Time.now();
      status = "New";
      leadType = input.leadType;
      productInterest = null;
      recipient = null;
      assignedRep = null;
    };
  };

  public func createCheckout(input : CheckoutLeadInput, id : Nat) : CartLead {
    {
      id;
      name = input.name;
      phone = input.phone;
      email = "";
      productName = "";
      productIds = input.productIds;
      createdAt = Time.now();
      status = "New";
      leadType = #Checkout;
      productInterest = null;
      recipient = null;
      assignedRep = null;
    };
  };

  public func createBrowse(input : BrowseLeadInput, id : Nat) : CartLead {
    {
      id;
      name = input.name;
      phone = input.phone;
      email = "";
      productName = "";
      productIds = [];
      createdAt = Time.now();
      status = "New";
      leadType = #Browse;
      productInterest = input.productInterest;
      recipient = input.recipient;
      assignedRep = null;
    };
  };

  public func updateStatus(lead : CartLead, status : Text) : CartLead {
    { lead with status };
  };

  /// Set the assigned sales rep (principal Text) on a cart lead.
  /// Pass `null` to unassign. Used by the admin-only `assignLeadToRep`.
  public func assignRep(lead : CartLead, repPrincipal : ?Text) : CartLead {
    { lead with assignedRep = repPrincipal };
  };

  public func listAll(leads : Map.Map<Nat, CartLead>) : [CartLead] {
    let all = leads.values().toArray();
    all.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };
};
