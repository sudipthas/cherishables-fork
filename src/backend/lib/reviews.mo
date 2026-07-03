import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import CommonTypes "../types/common";

module {
  public func listAll(reviewsMap : Map.Map<Text, CommonTypes.Review>) : [(Text, CommonTypes.Review)] {
    let buf = List.empty<(Text, CommonTypes.Review)>();
    for ((id, review) in reviewsMap.entries()) {
      buf.add((id, review));
    };
    buf.toArray();
  };

  public func listApproved(reviewsMap : Map.Map<Text, CommonTypes.Review>) : [(Text, CommonTypes.Review)] {
    let buf = List.empty<(Text, CommonTypes.Review)>();
    for ((id, review) in reviewsMap.entries()) {
      if (review.status == #Approved) {
        buf.add((id, review));
      };
    };
    buf.toArray();
  };

  public func listPending(reviewsMap : Map.Map<Text, CommonTypes.Review>) : [(Text, CommonTypes.Review)] {
    let buf = List.empty<(Text, CommonTypes.Review)>();
    for ((id, review) in reviewsMap.entries()) {
      if (review.status == #Pending) {
        buf.add((id, review));
      };
    };
    buf.toArray();
  };

  public func add(
    reviewsMap : Map.Map<Text, CommonTypes.Review>,
    reviewsState : { var nextReviewId : Nat },
    name : Text,
    text : Text,
    rating : Nat,
    imageUrl : ?Text,
    status : CommonTypes.ReviewStatus,
  ) : CommonTypes.Review {
    let id = "review-" # reviewsState.nextReviewId.toText();
    reviewsState.nextReviewId += 1;
    let now = Time.now();
    let review : CommonTypes.Review = {
      id;
      name;
      text;
      rating;
      imageUrl;
      status;
      createdAt = now;
      updatedAt = now;
    };
    reviewsMap.add(id, review);
    review;
  };

  public func update(
    reviewsMap : Map.Map<Text, CommonTypes.Review>,
    id : Text,
    name : Text,
    text : Text,
    rating : Nat,
    imageUrl : ?Text,
    status : ?CommonTypes.ReviewStatus,
  ) : ?CommonTypes.Review {
    switch (reviewsMap.get(id)) {
      case null { null };
      case (?existing) {
        let updated : CommonTypes.Review = {
          existing with
          name;
          text;
          rating;
          imageUrl;
          status = switch (status) {
            case (?s) { s };
            case null { existing.status };
          };
          updatedAt = Time.now();
        };
        reviewsMap.add(id, updated);
        ?updated;
      };
    };
  };

  public func setStatus(
    reviewsMap : Map.Map<Text, CommonTypes.Review>,
    id : Text,
    newStatus : CommonTypes.ReviewStatus,
  ) : ?CommonTypes.Review {
    switch (reviewsMap.get(id)) {
      case null { null };
      case (?existing) {
        let updated : CommonTypes.Review = {
          existing with
          status = newStatus;
          updatedAt = Time.now();
        };
        reviewsMap.add(id, updated);
        ?updated;
      };
    };
  };

  public func remove(reviewsMap : Map.Map<Text, CommonTypes.Review>, id : Text) : Bool {
    let exists = reviewsMap.get(id) != null;
    if (exists) { reviewsMap.remove(id) };
    exists;
  };
};
