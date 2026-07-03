import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import GalleryLib "../lib/gallery";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  galleryImages : Map.Map<Text, CommonTypes.GalleryImage>,
  galleryState : { var nextGalleryImageId : Nat },
) {

  /// Get all gallery images sorted by displayOrder — public, no auth required.
  public query func getGalleryImages() : async [CommonTypes.GalleryImage] {
    GalleryLib.listSorted(galleryImages);
  };

  /// Get only active gallery images sorted by displayOrder — public, no auth required.
  public query func getActiveGalleryImages() : async [CommonTypes.GalleryImage] {
    GalleryLib.listActiveSorted(galleryImages);
  };

  /// Add a new gallery image — admin only.
  public shared ({ caller }) func addGalleryImage(
    title : Text,
    imageUrl : Text,
  ) : async CommonTypes.GalleryImage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add gallery images");
    };
    let id = GalleryLib.generateId(galleryState.nextGalleryImageId);
    galleryState.nextGalleryImageId += 1;
    let displayOrder = galleryImages.size();
    let image = GalleryLib.create(id, title, imageUrl, displayOrder);
    galleryImages.add(id, image);
    image;
  };

  /// Update a gallery image's title, order, or active state — admin only.
  public shared ({ caller }) func updateGalleryImage(
    id : Text,
    title : Text,
    displayOrder : Nat,
    isActive : Bool,
  ) : async ?CommonTypes.GalleryImage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update gallery images");
    };
    switch (galleryImages.get(id)) {
      case null { null };
      case (?existing) {
        let updated = GalleryLib.update(existing, title, displayOrder, isActive);
        galleryImages.add(id, updated);
        ?updated;
      };
    };
  };

  /// Delete a gallery image by ID — admin only.
  public shared ({ caller }) func deleteGalleryImage(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete gallery images");
    };
    switch (galleryImages.get(id)) {
      case null { false };
      case (?_) {
        galleryImages.remove(id);
        true;
      };
    };
  };
};
