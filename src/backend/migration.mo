import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "types/common";
import CartTypes "types/cart";
import EmailTypes "types/email-communication";
import CustomerAuthTypes "types/customer-auth";
import TeamTypes "types/team-access";
import CartLeadsLib "lib/cart-leads";

module {
  // Old types defined inline, mirroring the previously deployed stable
  // signature captured in .old/src/backend/dist/backend.most. Do NOT import
  // from .old/ — paths are not resolvable in the sandboxed compile
  // environment. The .most file is the authoritative source for the old
  // stable field shapes.

  // Old LeadType is structurally identical to the new CartLeadsLib.LeadType
  // ({#Checkout; #CartAbandon; #Browse}). We define it inline only so the
  // old CartLead record below is self-contained.
  public type OldLeadType = {
    #Checkout;
    #CartAbandon;
    #Browse;
  };

  // Old SalesRep as last deployed (per .most line 253, the most-recent
  // stable signature): { addedAt : Int; email : ?Text; principal : Text }.
  // The new SalesRep adds name and phone (both optional); email is carried
  // over from the previous version.
  public type OldSalesRep = {
    principal : Text;
    email : ?Text;
    addedAt : Int;
  };

  // Old CartLead as deployed (per .most lines 167-180): no assignedRep field.
  public type OldCartLead = {
    id : Nat;
    name : Text;
    phone : Text;
    email : Text;
    productName : Text;
    productIds : [Text];
    createdAt : Int;
    status : Text;
    leadType : OldLeadType;
    productInterest : ?Text;
    recipient : ?Text;
  };

  // OldActor mirrors every stable field of the previously deployed actor.
  // Field names, types, and mutability must match the .most domain signature
  // exactly. Per .most:
  //   - salesReps was `in` (let-bound, stable) → non-var here.
  //   - cartLeads was `in var` → var here.
  //   - nextCartLeadId was `in var` → var here.
  // All other fields use the same concrete imported types as the new actor
  // (their value types did not change between versions).
  public type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    adminEmailConfig : { var config : EmailTypes.AdminEmailConfig };
    cartCustomerIndex : Map.Map<Text, Text>;
    var cartLeads : Map.Map<Nat, OldCartLead>;
    cartLeadsState : { var nextCartLeadId : Nat };
    cartSessionIndex : Map.Map<Text, Text>;
    cartState : { var nextCartId : Nat };
    carts : Map.Map<Text, CartTypes.Cart>;
    communicationLogs : Map.Map<Text, EmailTypes.CommunicationLog>;
    customerAuthState : { var nextCustomerId : Nat };
    customers : Map.Map<CustomerAuthTypes.CustomerId, CustomerAuthTypes.Customer>;
    emailState : { var nextLogId : Nat; var templatesSeeded : Bool };
    emailTemplates : Map.Map<EmailTypes.EmailTemplateId, EmailTypes.EmailTemplate>;
    galleryImages : Map.Map<Text, CommonTypes.GalleryImage>;
    galleryState : { var nextGalleryImageId : Nat };
    heroVideoSettings : { var autoplay : Bool; var keepVolumeOn : Bool; var loopEnabled : Bool; var muted : Bool };
    heroVideos : Map.Map<Text, CommonTypes.HeroVideo>;
    heroVideosState : { var nextHeroVideoId : Nat };
    leads : Map.Map<Text, CommonTypes.Lead>;
    leadsState : { var nextLeadId : Nat };
    mobileWebAppSettings : { var settings : CommonTypes.MobileWebAppSettings };
    var nextCartLeadId : Nat;
    orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>;
    otps : Map.Map<Text, CustomerAuthTypes.OtpEntry>;
    products : Map.Map<Text, CommonTypes.AddonProduct>;
    productsState : { var maxDisplayOrder : Nat; var nextProductId : Nat; var seeded : Bool };
    razorpayState : { var razorpayKeyId : Text; var razorpayKeySecret : Text };
    reviewsMap : Map.Map<Text, CommonTypes.Review>;
    reviewsState : { var nextReviewId : Nat };
    salesReps : Map.Map<Text, OldSalesRep>;
    sessions : Map.Map<Text, CustomerAuthTypes.SessionToken>;
    state : { var adminEmail : Text; var nextOrderId : Nat };
    teamMembers : Map.Map<Text, CommonTypes.TeamMember>;
    teamMembersState : { var nextTeamMemberId : Nat };
    websiteSettings : { var settings : CommonTypes.WebsiteSettings };
  };

  // NewActor mirrors the new actor's stable fields. Only the two collections
  // whose value types changed (salesReps, cartLeads) need precise new types;
  // the rest pass through unchanged. Field names and mutability must match
  // the new actor body (main.mo).
  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    adminEmailConfig : { var config : EmailTypes.AdminEmailConfig };
    cartCustomerIndex : Map.Map<Text, Text>;
    var cartLeads : Map.Map<Nat, CartLeadsLib.CartLead>;
    cartLeadsState : { var nextCartLeadId : Nat };
    cartSessionIndex : Map.Map<Text, Text>;
    cartState : { var nextCartId : Nat };
    carts : Map.Map<Text, CartTypes.Cart>;
    communicationLogs : Map.Map<Text, EmailTypes.CommunicationLog>;
    customerAuthState : { var nextCustomerId : Nat };
    customers : Map.Map<CustomerAuthTypes.CustomerId, CustomerAuthTypes.Customer>;
    emailState : { var nextLogId : Nat; var templatesSeeded : Bool };
    emailTemplates : Map.Map<EmailTypes.EmailTemplateId, EmailTypes.EmailTemplate>;
    galleryImages : Map.Map<Text, CommonTypes.GalleryImage>;
    galleryState : { var nextGalleryImageId : Nat };
    heroVideoSettings : { var autoplay : Bool; var keepVolumeOn : Bool; var loopEnabled : Bool; var muted : Bool };
    heroVideos : Map.Map<Text, CommonTypes.HeroVideo>;
    heroVideosState : { var nextHeroVideoId : Nat };
    leads : Map.Map<Text, CommonTypes.Lead>;
    leadsState : { var nextLeadId : Nat };
    mobileWebAppSettings : { var settings : CommonTypes.MobileWebAppSettings };
    var nextCartLeadId : Nat;
    orders : Map.Map<CommonTypes.OrderId, CommonTypes.Order>;
    otps : Map.Map<Text, CustomerAuthTypes.OtpEntry>;
    products : Map.Map<Text, CommonTypes.AddonProduct>;
    productsState : { var maxDisplayOrder : Nat; var nextProductId : Nat; var seeded : Bool };
    razorpayState : { var razorpayKeyId : Text; var razorpayKeySecret : Text };
    reviewsMap : Map.Map<Text, CommonTypes.Review>;
    reviewsState : { var nextReviewId : Nat };
    salesReps : Map.Map<Text, TeamTypes.SalesRep>;
    sessions : Map.Map<Text, CustomerAuthTypes.SessionToken>;
    state : { var adminEmail : Text; var nextOrderId : Nat };
    teamMembers : Map.Map<Text, CommonTypes.TeamMember>;
    teamMembersState : { var nextTeamMemberId : Nat };
    websiteSettings : { var settings : CommonTypes.WebsiteSettings };
  };

  /// Map each old SalesRep to the new shape, filling the new optional
  /// fields (name, phone) with null. email is carried over from the
  /// previous version's value.
  func migrateSalesRep(old : OldSalesRep) : TeamTypes.SalesRep {
    {
      principal = old.principal;
      email = old.email;
      name = null;
      phone = null;
      addedAt = old.addedAt;
    };
  };

  /// Map each old CartLead to the new shape, adding assignedRep = null.
  /// leadType is structurally identical, so it passes through unchanged.
  func migrateCartLead(old : OldCartLead) : CartLeadsLib.CartLead {
    {
      id = old.id;
      name = old.name;
      phone = old.phone;
      email = old.email;
      productName = old.productName;
      productIds = old.productIds;
      createdAt = old.createdAt;
      status = old.status;
      leadType = old.leadType;
      productInterest = old.productInterest;
      recipient = old.recipient;
      assignedRep = null;
    };
  };

  public func run(old : OldActor) : NewActor {
    let salesReps = old.salesReps.map<Text, OldSalesRep, TeamTypes.SalesRep>(
      func(_principal, oldRep) { migrateSalesRep(oldRep) },
    );
    let cartLeads = old.cartLeads.map<Nat, OldCartLead, CartLeadsLib.CartLead>(
      func(_id, oldLead) { migrateCartLead(oldLead) },
    );
    {
      accessControlState = old.accessControlState;
      adminEmailConfig = old.adminEmailConfig;
      cartCustomerIndex = old.cartCustomerIndex;
      var cartLeads;
      cartLeadsState = old.cartLeadsState;
      cartSessionIndex = old.cartSessionIndex;
      cartState = old.cartState;
      carts = old.carts;
      communicationLogs = old.communicationLogs;
      customerAuthState = old.customerAuthState;
      customers = old.customers;
      emailState = old.emailState;
      emailTemplates = old.emailTemplates;
      galleryImages = old.galleryImages;
      galleryState = old.galleryState;
      heroVideoSettings = old.heroVideoSettings;
      heroVideos = old.heroVideos;
      heroVideosState = old.heroVideosState;
      leads = old.leads;
      leadsState = old.leadsState;
      mobileWebAppSettings = old.mobileWebAppSettings;
      var nextCartLeadId = old.nextCartLeadId;
      orders = old.orders;
      otps = old.otps;
      products = old.products;
      productsState = old.productsState;
      razorpayState = old.razorpayState;
      reviewsMap = old.reviewsMap;
      reviewsState = old.reviewsState;
      salesReps;
      sessions = old.sessions;
      state = old.state;
      teamMembers = old.teamMembers;
      teamMembersState = old.teamMembersState;
      websiteSettings = old.websiteSettings;
    };
  };
};
