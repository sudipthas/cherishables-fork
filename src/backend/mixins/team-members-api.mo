import Map "mo:core/Map";
import Array "mo:core/Array";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import TeamMembersLib "../lib/team-members";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  teamMembers : Map.Map<Text, CommonTypes.TeamMember>,
  teamMembersState : { var nextTeamMemberId : Nat },
) {

  /// Get all team members sorted by displayOrder — public, no auth required.
  public query func getTeamMembers() : async [CommonTypes.TeamMember] {
    TeamMembersLib.listSorted(teamMembers);
  };

  /// Get only active team members sorted by displayOrder — public, no auth required.
  public query func getActiveTeamMembers() : async [CommonTypes.TeamMember] {
    TeamMembersLib.listActiveSorted(teamMembers);
  };

  /// Add a new team member — admin only.
  public shared ({ caller }) func addTeamMember(
    name : Text,
    role : Text,
    imageUrl : Text,
  ) : async CommonTypes.TeamMember {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add team members");
    };
    let id = TeamMembersLib.generateId(teamMembersState.nextTeamMemberId);
    teamMembersState.nextTeamMemberId += 1;
    let displayOrder = teamMembers.size();
    let member = TeamMembersLib.create(id, name, role, imageUrl, displayOrder);
    teamMembers.add(id, member);
    member;
  };

  /// Update a team member's details — admin only.
  public shared ({ caller }) func updateTeamMember(
    id : Text,
    name : Text,
    role : Text,
    imageUrl : Text,
    displayOrder : Nat,
    isActive : Bool,
  ) : async ?CommonTypes.TeamMember {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update team members");
    };
    switch (teamMembers.get(id)) {
      case null { null };
      case (?existing) {
        let updated = TeamMembersLib.update(existing, name, role, imageUrl, displayOrder, isActive);
        teamMembers.add(id, updated);
        ?updated;
      };
    };
  };

  /// Delete a team member by ID — admin only.
  public shared ({ caller }) func deleteTeamMember(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete team members");
    };
    switch (teamMembers.get(id)) {
      case null { false };
      case (?_) {
        teamMembers.remove(id);
        true;
      };
    };
  };

  /// Reorder team members by updating displayOrder for each ID — admin only.
  public shared ({ caller }) func reorderTeamMembers(
    ids : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reorder team members");
    };
    for ((index, id) in ids.enumerate()) {
      switch (teamMembers.get(id)) {
        case null {};
        case (?existing) {
          let updated = { existing with displayOrder = index };
          teamMembers.add(id, updated);
        };
      };
    };
  };
};
