import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import ReviewsLib "../lib/reviews";

mixin (
  accessControlState : AccessControl.AccessControlState,
  reviewsMap : Map.Map<Text, CommonTypes.Review>,
  reviewsState : { var nextReviewId : Nat },
) {

  /// List all reviews as (id, Review) pairs — admin only.
  public query ({ caller }) func listReviews() : async [(Text, CommonTypes.Review)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.listAll(reviewsMap);
  };

  /// List only approved reviews — public, no auth required.
  public query func getPublicReviews() : async [(Text, CommonTypes.Review)] {
    ReviewsLib.listApproved(reviewsMap);
  };

  /// List only pending reviews — admin only.
  public query ({ caller }) func listPendingReviews() : async [(Text, CommonTypes.Review)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.listPending(reviewsMap);
  };

  /// Submit a review from a customer — public, no auth required. Defaults to Pending status.
  public shared func submitReview(
    name : Text,
    text : Text,
    rating : Nat,
    imageUrl : ?Text,
  ) : async CommonTypes.Review {
    ReviewsLib.add(reviewsMap, reviewsState, name, text, rating, imageUrl, #Pending);
  };

  /// Add a new review — admin only, defaults to Approved status.
  public shared ({ caller }) func addReview(
    name : Text,
    text : Text,
    rating : Nat,
    imageUrl : ?Text,
  ) : async CommonTypes.Review {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.add(reviewsMap, reviewsState, name, text, rating, imageUrl, #Approved);
  };

  /// Update an existing review — admin only, allows optional status change.
  public shared ({ caller }) func updateReview(
    id : Text,
    name : Text,
    text : Text,
    rating : Nat,
    imageUrl : ?Text,
    status : ?CommonTypes.ReviewStatus,
  ) : async ?CommonTypes.Review {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.update(reviewsMap, id, name, text, rating, imageUrl, status);
  };

  /// Approve a pending review — admin only.
  public shared ({ caller }) func approveReview(id : Text) : async ?CommonTypes.Review {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.setStatus(reviewsMap, id, #Approved);
  };

  /// Reject a pending review — admin only.
  public shared ({ caller }) func rejectReview(id : Text) : async ?CommonTypes.Review {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.setStatus(reviewsMap, id, #Rejected);
  };

  /// Delete a review by id — admin only. Returns true if found and deleted.
  public shared ({ caller }) func deleteReview(id : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    ReviewsLib.remove(reviewsMap, id);
  };
};
