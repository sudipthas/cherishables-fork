import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  leads : Map.Map<Text, CommonTypes.Lead>,
  leadsState : { var nextLeadId : Nat },
) {

  /// Submit a lead — no authentication required, callable by any visitor.
  public shared ({ caller }) func saveLead(
    name : Text,
    phone : Text,
    email : Text,
    subject : Text,
    message : Text,
  ) : async { #ok : Text; #err : Text } {
    ignore caller;
    leadsState.nextLeadId += 1;
    let id = "LEAD-" # leadsState.nextLeadId.toText();
    let lead : CommonTypes.Lead = {
      id;
      name;
      phone;
      email;
      subject;
      message;
      createdAt = Time.now();
      status = "New";
    };
    leads.add(id, lead);
    #ok(id);
  };

  /// Update the status of a lead by id — admin only.
  public shared ({ caller }) func updateLeadStatus(id : Text, status : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (leads.get(id)) {
      case null { #err("Lead not found: " # id) };
      case (?lead) {
        leads.add(id, { lead with status });
        #ok(());
      };
    };
  };

  /// Delete a lead by id — admin only.
  public shared ({ caller }) func deleteLead(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (leads.get(id)) {
      case null { false };
      case (?_) {
        leads.remove(id);
        true;
      };
    };
  };

  /// List all captured leads — admin only.
  public query ({ caller }) func listLeads() : async [CommonTypes.Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    leads.values().toArray();
  };
};
