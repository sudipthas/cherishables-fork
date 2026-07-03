import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import CommonTypes "../types/common";
import Array "mo:core/Array";

module {
  public type TeamMember = CommonTypes.TeamMember;

  public func generateId(counter : Nat) : Text {
    "team-" # counter.toText();
  };

  public func create(
    id : Text,
    name : Text,
    role : Text,
    imageUrl : Text,
    displayOrder : Nat,
  ) : TeamMember {
    {
      id;
      name;
      role;
      imageUrl;
      displayOrder;
      isActive = true;
      uploadedAt = Time.now();
    };
  };

  public func update(
    member : TeamMember,
    name : Text,
    role : Text,
    imageUrl : Text,
    displayOrder : Nat,
    isActive : Bool,
  ) : TeamMember {
    { member with name; role; imageUrl; displayOrder; isActive };
  };

  public func listSorted(members : Map.Map<Text, TeamMember>) : [TeamMember] {
    let arr = members.values().toArray();
    arr.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };

  public func listActiveSorted(members : Map.Map<Text, TeamMember>) : [TeamMember] {
    let arr = members.values().filter(func(m) { m.isActive }).toArray();
    arr.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };
};
