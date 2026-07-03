import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import CommonTypes "../types/common";
import Array "mo:core/Array";

module {
  public type GalleryImage = CommonTypes.GalleryImage;

  public func generateId(counter : Nat) : Text {
    "gallery-" # counter.toText();
  };

  public func create(
    id : Text,
    title : Text,
    imageUrl : Text,
    displayOrder : Nat,
  ) : GalleryImage {
    {
      id;
      title;
      imageUrl;
      displayOrder;
      isActive = true;
      uploadedAt = Time.now();
    };
  };

  public func update(
    image : GalleryImage,
    title : Text,
    displayOrder : Nat,
    isActive : Bool,
  ) : GalleryImage {
    { image with title; displayOrder; isActive };
  };

  public func listSorted(images : Map.Map<Text, GalleryImage>) : [GalleryImage] {
    let arr = images.values().toArray();
    arr.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };

  public func listActiveSorted(images : Map.Map<Text, GalleryImage>) : [GalleryImage] {
    let arr = images.values().filter(func(img) { img.isActive }).toArray();
    arr.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };
};
