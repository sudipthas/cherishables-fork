import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type AddonProduct = {
    id : Text;
    name : Text;
    price : Nat;
    category : Text;
    imageUrl : Text;
    displayOrder : Nat;
    codEnabled : Bool;
    description : ?Text;
  };

  public type OrderId = Text;
  public type Timestamp = Int;

  public type PortraitType = {
    #Single;
    #Couple;
    #Family;
    #Group;
  };

  public type ArtStyle = {
    #CuteCartoon;
    #ProfessionalPortrait;
    #SoftAesthetic;
    #FunnyExaggerated;
    #CoupleIllustration;
    #Chibi;
  };

  public type PaymentStatus = {
    #Pending;
    #AdvancePaid;
    #Paid;
    #Failed;
  };

  public type PaymentMode = {
    #Full;
    #Advance;
  };

  public type PaymentMethod = {
    #Razorpay;
    #COD;
  };

  public type OrderStatus = {
    #Received;
    #InProgress;
    #Shipped;
    #OutForDelivery;
    #Completed;
    #Delivered;
  };

  public type DeliveryAddress = {
    fullName : Text;
    addressLine1 : Text;
    addressLine2 : Text;
    city : Text;
    state : Text;
    pincode : Text;
    country : Text;
  };

  public type Order = {
    orderId : OrderId;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    portraitType : PortraitType;
    artStyle : ArtStyle;
    notes : Text;
    photoKeys : [Storage.ExternalBlob];
    paymentStatus : PaymentStatus;
    orderStatus : OrderStatus;
    createdAt : Timestamp;
    estimatedDelivery : Timestamp;
    estimatedDeliveryText : Text;
    paymentRef : ?Text;
    upiRef : ?Text;
    razorpayPaymentId : ?Text;
    razorpayOrderId : ?Text;
    paymentMethod : ?PaymentMethod;
    finalArtworkKey : ?Storage.ExternalBlob;

    amount : Nat;
    addOnsAmount : Nat;
    referredBy : ?Text;
    deliveryAddress : ?DeliveryAddress;
    selectedAddOns : ?Text;
    portraitTypeText : ?Text;
    cartoonStyle : Text;
    orderItems : [OrderItem];
    customerId : ?Text;
    isRead : Bool;
    portraitPrice : Nat;
    address : Text;
    pincode : Text;
    is3DModel : Bool;
    customerAcknowledged : Bool;

    paymentMode : PaymentMode;
    advancePaid : Nat;
    totalAmount : Nat;
    specialInstructions : ?Text;
  };

  public type CreateOrderRequest = {
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    notes : Text;
    photoKeys : [Storage.ExternalBlob];
    addOnsAmount : Nat;
    referredBy : Text;
    deliveryAddress : DeliveryAddress;
    selectedAddOns : Text;
    paymentMethod : PaymentMethod;
    portraitType : Text;
    portraitPrice : Nat;
    cartoonStyle : Text;
    customerId : Text;
    orderItems : [OrderItem];
    address : Text;
    pincode : Text;
    is3DModel : Bool;
    customerAcknowledged : Bool;

    paymentMode : PaymentMode;
    specialInstructions : ?Text;
  };

  public type OrderItem = {
    productId : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
    flowType : Text;
    itemImages : [Text];
  };

  public type RazorpayOrderDetails = {
    orderId : Text;
    amount : Nat;
    currency : Text;
    keyId : Text;
  };

  public type CreateOrderResponse = {
    orderId : OrderId;
    amount : Nat;
    currency : Text;
    razorpayOrder : ?RazorpayOrderDetails;
  };

  public type ConfirmPaymentResponse = {
    orderId : OrderId;
  };

  public type Lead = {
    id : Text;
    name : Text;
    phone : Text;
    email : Text;
    subject : Text;
    message : Text;
    createdAt : Int;
    status : Text;
  };

  public type HeroPlatform = {
    #Website;
    #Mobile;
    #Both;
  };

  public type HeroVideo = {
    id : Text;
    title : Text;
    videoUrl : Text;
    isActive : Bool;
    isDefault : Bool;
    displayOrder : Nat;
    uploadedAt : Int;
    platform : ?HeroPlatform;
  };

  public type GalleryImage = {
    id : Text;
    title : Text;
    imageUrl : Text;
    displayOrder : Nat;
    isActive : Bool;
    uploadedAt : Int;
  };

  public type TeamMember = {
    id : Text;
    name : Text;
    role : Text;
    imageUrl : Text;
    displayOrder : Nat;
    isActive : Bool;
    uploadedAt : Int;
  };

  public type HeroVideoSettings = {
    keepVolumeOn : Bool;
    autoplay : Bool;
    loopEnabled : Bool;
    muted : Bool;
  };

  public type WebsiteSettings = {
    siteName : Text;
    logoUrl : Text;
    primaryColor : Text;
    secondaryColor : Text;
    contactEmail : Text;
    contactPhone : Text;
    instagramUrl : Text;
    whatsappNumber : Text;
    heroVideoIds : [Text];
  };

  public type MobileWebAppSettings = {
    appName : Text;
    splashScreenUrl : Text;
    primaryColor : Text;
    secondaryColor : Text;
    heroVideoIds : [Text];
  };

  public type ReviewStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  public type Review = {
    id : Text;
    name : Text;
    text : Text;
    rating : Nat;
    imageUrl : ?Text;
    status : ReviewStatus;
    createdAt : Int;
    updatedAt : Int;
  };

};
