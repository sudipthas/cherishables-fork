import Map "mo:core/Map";
import _Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import CommonTypes "types/common";
import OrdersMixin "mixins/orders-api";
import ProductsMixin "mixins/products-api";
import LeadsMixin "mixins/leads-api";
import HeroVideosMixin "mixins/hero-videos-api";
import GalleryMixin "mixins/gallery-api";
import ReviewsMixin "mixins/reviews-api";
import TeamMembersMixin "mixins/team-members-api";
import TeamAccessMixin "mixins/team-access-api";
import TeamTypes "types/team-access";


import Time "mo:core/Time";
import SettingsMixin "mixins/settings-api";
import SettingsLib "lib/settings";
import EmailCommunicationMixin "./mixins/email-communication-api";
import EmailTypes "./types/email-communication";
import EmailLib "./lib/email-communication";
import NotificationsMixin "mixins/notifications-api";
import CartTypes "types/cart";
import CartMixin "mixins/cart-api";
import _CartLib "lib/cart";
import CartLeadsMixin "mixins/cart-leads-api";
import CartLeadsLib "lib/cart-leads";



import EmailClient "mo:caffeineai-email/emailClient";
import CustomerAuthTypes "types/customer-auth";
import CustomerAuthMixin "mixins/customer-auth-api";
import _CustomerAuthLib "lib/customer-auth";
import Migration "migration";



















































 



















(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Object storage infrastructure
  include MixinObjectStorage();

  // Products state
  let products = Map.empty<Text, CommonTypes.AddonProduct>();
  let productsState = { var nextProductId : Nat = 0; var seeded : Bool = false; var maxDisplayOrder : Nat = 0 };

  // Seed default products on first deploy OR if products map is empty (recovery after upgrade).
  // With enhanced orthogonal persistence the Map survives upgrades, but if somehow empty,
  // this guard re-seeds so products always load.
  if (not productsState.seeded or products.size() == 0) {
    let defaultProducts : [CommonTypes.AddonProduct] = [
      { id = "prod_1";  name = "Custom Printed T-Shirts";         price = 69900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"; displayOrder = 1; codEnabled = false; description = null },
      { id = "prod_2";  name = "Personalized Coffee Mugs";        price = 39900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop"; displayOrder = 2; codEnabled = false; description = null },
      { id = "prod_3";  name = "Custom Tote Bags";                price = 59900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop"; displayOrder = 3; codEnabled = false; description = null },
      { id = "prod_4";  name = "Premium HD Portrait Print";       price = 79900;   category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1574182245530-967d9b3831af?w=400&h=400&fit=crop"; displayOrder = 4; codEnabled = false; description = null },
      { id = "prod_5";  name = "Matte Finish Portrait Frame";     price = 129900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"; displayOrder = 5; codEnabled = false; description = null },
      { id = "prod_6";  name = "Glossy Finish Portrait Print";    price = 149900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400&h=400&fit=crop"; displayOrder = 6; codEnabled = false; description = null },
      { id = "prod_7";  name = "Canvas Print with Wooden Frame";  price = 219900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop"; displayOrder = 7; codEnabled = false; description = null },
      { id = "prod_8";  name = "Black Matte Wooden Frame";        price = 199900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=400&h=400&fit=crop"; displayOrder = 8; codEnabled = false; description = null },
      { id = "prod_9";  name = "White Glossy Modern Frame";       price = 199900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop"; displayOrder = 9; codEnabled = false; description = null },
      { id = "prod_10"; name = "Vintage Wooden Portrait Frame";   price = 249900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop"; displayOrder = 10; codEnabled = false; description = null },
      { id = "prod_11"; name = "Floating Frame Wall Art";         price = 279900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=400&h=400&fit=crop"; displayOrder = 11; codEnabled = false; description = null },
      { id = "prod_12"; name = "3D Wooden Frame with LED Lights"; price = 449900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=400&h=400&fit=crop"; displayOrder = 12; codEnabled = false; description = null },
      { id = "prod_13"; name = "Neon Light Portrait Frame";       price = 549900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop"; displayOrder = 13; codEnabled = false; description = null },
      { id = "prod_14"; name = "Personalized Night Lamp Frame";   price = 349900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&seed=14"; displayOrder = 14; codEnabled = false; description = null },
      { id = "prod_15"; name = "LED Light Frame";                 price = 429900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop"; displayOrder = 15; codEnabled = false; description = null },
      { id = "prod_16"; name = "Acrylic Glass Frame";             price = 329900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=400&fit=crop"; displayOrder = 16; codEnabled = false; description = null },
      { id = "prod_17"; name = "Neon Light Frame";                price = 529900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1609097960451-0e6d4ee2c8e9?w=400&h=400&fit=crop"; displayOrder = 17; codEnabled = false; description = null },
      { id = "prod_18"; name = "Crystal Glass Block";             price = 499900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1601751818941-571144562871?w=400&h=400&fit=crop"; displayOrder = 18; codEnabled = false; description = null },
      { id = "prod_19"; name = "Custom Bobblehead 3D Model";      price = 699900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=400&h=400&fit=crop"; displayOrder = 19; codEnabled = false; description = null },
      { id = "prod_20"; name = "Bobblehead Model";                price = 599900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=400&h=400&fit=crop"; displayOrder = 20; codEnabled = false; description = null },
      { id = "prod_21"; name = "Mini Figurine";                   price = 399900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"; displayOrder = 21; codEnabled = false; description = null },
      { id = "prod_22"; name = "Couple Miniature";                price = 899900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=400&fit=crop"; displayOrder = 22; codEnabled = false; description = null },
      { id = "prod_23"; name = "Wedding Miniature";               price = 1299900; category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop"; displayOrder = 23; codEnabled = false; description = null },
      { id = "prod_24"; name = "Family Miniature (4 Members)";    price = 1499900; category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1484244233201-29892afe6a2c?w=400&h=400&fit=crop"; displayOrder = 24; codEnabled = false; description = null },
      { id = "prod_25"; name = "Pet Miniature";                   price = 449900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop"; displayOrder = 25; codEnabled = false; description = null },
    ];
    for (p in defaultProducts.vals()) {
      products.add(p.id, p);
    };
    productsState.seeded := true;
    productsState.nextProductId := 25;
    productsState.maxDisplayOrder := 25;
  };

  // Orders state
  let orders = Map.empty<CommonTypes.OrderId, CommonTypes.Order>();
  let state = { var nextOrderId = 0; var adminEmail = "" };
  let razorpayState = { var razorpayKeyId = ""; var razorpayKeySecret = "" };
  // Leads state
  let leads = Map.empty<Text, CommonTypes.Lead>();
  let leadsState = { var nextLeadId : Nat = 0 };
  // Hero videos state
  let heroVideos = Map.empty<Text, CommonTypes.HeroVideo>();
  let heroVideosState = { var nextHeroVideoId : Nat = 0 };
  let heroVideoSettings = { var keepVolumeOn : Bool = true; var autoplay : Bool = true; var loopEnabled : Bool = true; var muted : Bool = false };

  // Website settings state
  let websiteSettings = { var settings : CommonTypes.WebsiteSettings = SettingsLib.defaultWebsiteSettings() };
  let mobileWebAppSettings = { var settings : CommonTypes.MobileWebAppSettings = SettingsLib.defaultMobileWebAppSettings() };

  // Gallery state
  let galleryImages = Map.empty<Text, CommonTypes.GalleryImage>();
  let galleryState = { var nextGalleryImageId : Nat = 0 };

  // Team members state
  let teamMembers = Map.empty<Text, CommonTypes.TeamMember>();
  let teamMembersState = { var nextTeamMemberId : Nat = 0 };

  // Sales-rep allowlist for the /team portal (founder-managed).
  let salesReps = Map.empty<Text, TeamTypes.SalesRep>();

  // Email communication state
  let emailTemplates = Map.empty<EmailTypes.EmailTemplateId, EmailTypes.EmailTemplate>();
  let communicationLogs = Map.empty<Text, EmailTypes.CommunicationLog>();
  let adminEmailConfig = { var config : EmailTypes.AdminEmailConfig = EmailLib.defaultAdminEmailConfig() };
  let emailState = { var templatesSeeded = false; var nextLogId = 0 };

  // Seed default email templates on first deploy OR add missing ones on upgrade.
  // The templatesSeeded guard ensures we don't re-add on every restart for existing templates,
  // but we also check for missing templates to support adding new default templates over time.
  if (not emailState.templatesSeeded) {
    let defaults = EmailLib.getDefaultTemplates();
    for (t in defaults.vals()) {
      emailTemplates.add(t.id, t);
    };
    emailState.templatesSeeded := true;
  } else {
    // Re-seed any newly added default templates that may be missing after an upgrade
    let defaults = EmailLib.getDefaultTemplates();
    for (t in defaults.vals()) {
      if (emailTemplates.get(t.id) == null) {
        emailTemplates.add(t.id, t);
      };
    };
  };

  // Reviews state
  let reviewsMap = Map.empty<Text, CommonTypes.Review>();
  let reviewsState = { var nextReviewId : Nat = 0 };

  // Seed default reviews on first deploy if store is empty.
  if (reviewsMap.size() == 0) {
    let now = Time.now();
    let seedData : [(Text, Text, Nat, ?Text)] = [
      (
        "Subiktha Shalom",
        "The perfect gift for my small business \u{1F979}\u{2728} A beautiful mini scoop resembling my mini shop so perfectly! Couldn\u{2019}t thank Cherishables enough \u{2764}\u{FE0F} Best for custom artwork, caricatures & print materials. Truly loved every detail \u{1F3A8}\u{2728}",
        5,
        null,
      ),
      (
        "Sudiptha Sharon",
        "Gifted myself a beautiful wooden piece of caricature art \u{1F979}\u{2728} A tiny masterpiece filled with memories and creativity \u{2764}\u{FE0F} Absolutely in love with every detail by Cherishables \u{1F3A8}",
        5,
        null,
      ),
      (
        "Sudiptha Sharon",
        "Gifted my parents a miniature of themselves and they absolutely loved it \u{1F979}\u{2764}\u{FE0F} Such a special and memorable surprise filled with emotions and tiny little details \u{2728} Thank you Cherishables for bringing this beautiful idea to life \u{1F3A8}",
        5,
        null,
      ),
      (
        "Sudiptha Sharon",
        "My granny loved this miniature \u{1F979}\u{2764}\u{FE0F} Seeing her smile made this piece even more special. Handcrafted with love by Cherishables",
        5,
        null,
      ),
      (
        "Sheela Kumari",
        "My baby\u{2019}s miniature is perfect \u{1F979}\u{1F496} Tiny details, big emotions, and a memory to cherish forever. Thank you Cherishables for bringing this cutie to life \u{2728}",
        5,
        null,
      ),
    ];
    for ((name, text, rating, imageUrl) in seedData.vals()) {
      let id = "review-" # reviewsState.nextReviewId.toText();
      reviewsState.nextReviewId += 1;
      let review : CommonTypes.Review = {
        id;
        name;
        text;
        rating;
        imageUrl;
        status = #Approved;
        createdAt = now;
        updatedAt = now;
      };
      reviewsMap.add(id, review);
    };
  };


  // Products domain API
  include ProductsMixin(accessControlState, products, productsState);

  // Orders domain API
  include OrdersMixin(accessControlState, orders, state, razorpayState, emailTemplates, communicationLogs, adminEmailConfig, emailState);
  // Leads domain API
  include LeadsMixin(accessControlState, leads, leadsState);
  // Hero videos domain API
  include HeroVideosMixin(accessControlState, heroVideos, heroVideosState, heroVideoSettings);

  // Gallery domain API
  include GalleryMixin(accessControlState, galleryImages, galleryState);

  // Team members domain API
  include TeamMembersMixin(accessControlState, teamMembers, teamMembersState);

  // Reviews domain API
  include ReviewsMixin(accessControlState, reviewsMap, reviewsState);

  // Email communication domain API
  include EmailCommunicationMixin(accessControlState, orders, emailTemplates, communicationLogs, adminEmailConfig, emailState);

  // Settings domain API
  include SettingsMixin(accessControlState, websiteSettings, mobileWebAppSettings);

  // Cart leads state (stable for migration)
   var cartLeads = Map.empty<Nat, CartLeadsLib.CartLead>();
   var nextCartLeadId : Nat = 0;
  let cartLeadsState = { var nextCartLeadId = nextCartLeadId };

  // Cart state
  let carts = Map.empty<Text, CartTypes.Cart>();
  let cartSessionIndex = Map.empty<Text, Text>();
  let cartCustomerIndex = Map.empty<Text, Text>();
  let cartState = { var nextCartId : Nat = 0 };

  // Cart domain API
  include CartMixin(accessControlState, carts, cartSessionIndex, cartCustomerIndex, cartState);

  // Cart leads domain API
  include CartLeadsMixin(accessControlState, cartLeads, cartLeadsState);

  // Team access domain API (founder + sales-rep portal)
  // Placed after CartLeadsMixin so the cartLeads state is in scope.
  include TeamAccessMixin(accessControlState, salesReps, products, orders, leads, cartLeads);

  // Customer auth state
  let customers = Map.empty<CustomerAuthTypes.CustomerId, CustomerAuthTypes.Customer>();
  let otps = Map.empty<Text, CustomerAuthTypes.OtpEntry>();
  let sessions = Map.empty<Text, CustomerAuthTypes.SessionToken>();
  let customerAuthState = { var nextCustomerId : Nat = 1 };

  // Initialize email client for customer auth
  // Email client module is used directly via EmailClient.sendServiceEmail

  // Customer auth domain API
  include CustomerAuthMixin(
    customers,
    otps,
    sessions,
    customerAuthState,
    EmailClient,
    orders,
  );

  // Notifications domain API
  include NotificationsMixin(accessControlState, orders, communicationLogs);

};

