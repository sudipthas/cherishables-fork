import CommonTypes "../types/common";

module {
  public type WebsiteSettings = CommonTypes.WebsiteSettings;
  public type MobileWebAppSettings = CommonTypes.MobileWebAppSettings;

  public func defaultWebsiteSettings() : WebsiteSettings {
    {
      siteName = "Cherishables";
      logoUrl = "";
      primaryColor = "#DC2626";
      secondaryColor = "#F59E0B";
      contactEmail = "orders@cherishables.in";
      contactPhone = "+91 84312 74009";
      instagramUrl = "https://instagram.com/cherishables.in";
      whatsappNumber = "+91 84312 74009";
      heroVideoIds = [];
    };
  };

  public func defaultMobileWebAppSettings() : MobileWebAppSettings {
    {
      appName = "Cherishables";
      splashScreenUrl = "";
      primaryColor = "#DC2626";
      secondaryColor = "#F59E0B";
      heroVideoIds = [];
    };
  };

  public func updateWebsiteSettings(
    _current : WebsiteSettings,
    settings : WebsiteSettings,
  ) : WebsiteSettings {
    ignore _current;
    settings;
  };

  public func updateMobileWebAppSettings(
    _current : MobileWebAppSettings,
    settings : MobileWebAppSettings,
  ) : MobileWebAppSettings {
    ignore _current;
    settings;
  };
};
