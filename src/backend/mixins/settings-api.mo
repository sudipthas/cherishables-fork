import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import SettingsLib "../lib/settings";

mixin (
  accessControlState : AccessControl.AccessControlState,
  websiteSettings : { var settings : CommonTypes.WebsiteSettings },
  mobileWebAppSettings : { var settings : CommonTypes.MobileWebAppSettings },
) {

  /// Get website settings — public, no auth required.
  public query func getWebsiteSettings() : async CommonTypes.WebsiteSettings {
    websiteSettings.settings;
  };

  /// Update website settings — admin only.
  public shared ({ caller }) func updateWebsiteSettings(
    settings : CommonTypes.WebsiteSettings,
  ) : async CommonTypes.WebsiteSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let updated = SettingsLib.updateWebsiteSettings(websiteSettings.settings, settings);
    websiteSettings.settings := updated;
    updated;
  };

  /// Get mobile web app settings — public, no auth required.
  public query func getMobileWebAppSettings() : async CommonTypes.MobileWebAppSettings {
    mobileWebAppSettings.settings;
  };

  /// Update mobile web app settings — admin only.
  public shared ({ caller }) func updateMobileWebAppSettings(
    settings : CommonTypes.MobileWebAppSettings,
  ) : async CommonTypes.MobileWebAppSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let updated = SettingsLib.updateMobileWebAppSettings(mobileWebAppSettings.settings, settings);
    mobileWebAppSettings.settings := updated;
    updated;
  };
};
