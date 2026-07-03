import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import CommonTypes "../types/common";

module {
  public type HeroVideo = CommonTypes.HeroVideo;

  public type HeroVideoSettings = CommonTypes.HeroVideoSettings;

  public func defaultSettings() : HeroVideoSettings {
    { keepVolumeOn = true; autoplay = true; loopEnabled = true; muted = false };
  };

  public func updateSettings(
    _current : HeroVideoSettings,
    keepVolumeOn : Bool,
    autoplay : Bool,
    loopEnabled : Bool,
    muted : Bool,
  ) : HeroVideoSettings {
    ignore _current;
    { keepVolumeOn; autoplay; loopEnabled; muted };
  };

  public func generateId(counter : Nat) : Text {
    "hv-" # counter.toText();
  };

  public func create(
    id : Text,
    title : Text,
    videoUrl : Text,
    displayOrder : Nat,
    platform : CommonTypes.HeroPlatform,
  ) : HeroVideo {
    {
      id;
      title;
      videoUrl;
      isActive = true;
      isDefault = false;
      displayOrder;
      uploadedAt = Time.now();
      platform = ?platform;
    };
  };

  public func update(
    video : HeroVideo,
    isActive : Bool,
    isDefault : Bool,
    displayOrder : Nat,
    platform : CommonTypes.HeroPlatform,
  ) : HeroVideo {
    { video with isActive; isDefault; displayOrder; platform = ?platform };
  };

  public func listByPlatform(
    videos : Map.Map<Text, HeroVideo>,
    _platform : CommonTypes.HeroPlatform,
  ) : [HeroVideo] {
    // Platform filtering removed — always return all active videos
    listActiveSorted(videos);
  };

  public func listSorted(videos : Map.Map<Text, HeroVideo>) : [HeroVideo] {
    let all = videos.values().toArray();
    all.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };

  public func listActiveSorted(videos : Map.Map<Text, HeroVideo>) : [HeroVideo] {
    let all = videos.values().toArray();
    let active = all.filter(func(v) { v.isActive });
    active.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };
};
