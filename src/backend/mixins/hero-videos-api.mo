import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import HeroVideosLib "../lib/hero-videos";

mixin (
  accessControlState : AccessControl.AccessControlState,
  heroVideos : Map.Map<Text, CommonTypes.HeroVideo>,
  heroVideosState : { var nextHeroVideoId : Nat },
  heroVideoSettings : { var keepVolumeOn : Bool; var autoplay : Bool; var loopEnabled : Bool; var muted : Bool },
) {

  /// Get the global hero video settings — public, no auth required.
  public query func getHeroVideoSettings() : async CommonTypes.HeroVideoSettings {
    {
      keepVolumeOn = heroVideoSettings.keepVolumeOn;
      autoplay = heroVideoSettings.autoplay;
      loopEnabled = heroVideoSettings.loopEnabled;
      muted = heroVideoSettings.muted;
    };
  };

  /// Update the global hero video settings — admin only.
  public shared ({ caller }) func setHeroVideoSettings(
    keepVolumeOn : Bool,
    autoplay : Bool,
    loopEnabled : Bool,
    muted : Bool,
  ) : async CommonTypes.HeroVideoSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let updated = HeroVideosLib.updateSettings({
      keepVolumeOn = heroVideoSettings.keepVolumeOn;
      autoplay = heroVideoSettings.autoplay;
      loopEnabled = heroVideoSettings.loopEnabled;
      muted = heroVideoSettings.muted;
    }, keepVolumeOn, autoplay, loopEnabled, muted);
    heroVideoSettings.keepVolumeOn := updated.keepVolumeOn;
    heroVideoSettings.autoplay := updated.autoplay;
    heroVideoSettings.loopEnabled := updated.loopEnabled;
    heroVideoSettings.muted := updated.muted;
    updated;
  };

  /// Get all hero videos sorted by displayOrder — public, no auth required.
  public query func getHeroVideos() : async [CommonTypes.HeroVideo] {
    HeroVideosLib.listSorted(heroVideos);
  };

  /// Get only active hero videos sorted by displayOrder — public, no auth required.
  public query func getActiveHeroVideos() : async [CommonTypes.HeroVideo] {
    HeroVideosLib.listActiveSorted(heroVideos);
  };

  /// Add a new hero video — admin only.
  public shared ({ caller }) func addHeroVideo(
    title : Text,
    videoUrl : Text,
    platform : CommonTypes.HeroPlatform,
  ) : async CommonTypes.HeroVideo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let id = HeroVideosLib.generateId(heroVideosState.nextHeroVideoId);
    heroVideosState.nextHeroVideoId += 1;
    let displayOrder = heroVideos.size() + 1;
    let video = HeroVideosLib.create(id, title, videoUrl, displayOrder, platform);
    heroVideos.add(id, video);
    video;
  };

  /// Update a hero video's toggle/order settings — admin only.
  public shared ({ caller }) func updateHeroVideo(
    id : Text,
    isActive : Bool,
    isDefault : Bool,
    displayOrder : Nat,
    platform : CommonTypes.HeroPlatform,
  ) : async ?CommonTypes.HeroVideo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (heroVideos.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated = HeroVideosLib.update(existing, isActive, isDefault, displayOrder, platform);
        heroVideos.add(id, updated);
        ?updated;
      };
    };
  };

  /// Get active hero videos — platform param accepted for backwards-compat but ignored; all active videos returned.
  public query func getActiveHeroVideosByPlatform(_platform : CommonTypes.HeroPlatform) : async [CommonTypes.HeroVideo] {
    HeroVideosLib.listActiveSorted(heroVideos);
  };

  /// Delete a hero video by ID — admin only.
  public shared ({ caller }) func deleteHeroVideo(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (heroVideos.get(id)) {
      case (null) { false };
      case (?_) {
        heroVideos.remove(id);
        true;
      };
    };
  };
};
