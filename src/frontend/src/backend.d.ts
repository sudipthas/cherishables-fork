import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface CommunicationLog {
    id: string;
    status: EmailStatus;
    subject: string;
    messages: Array<CommunicationMessage>;
    templateId: EmailTemplateId;
    body: string;
    errorMessage?: string;
    templateName: string;
    sentAt?: bigint;
    orderId: string;
    adminSeenAt?: bigint;
    recipientEmail: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface HeroVideoSettings {
    muted: boolean;
    autoplay: boolean;
    loopEnabled: boolean;
    keepVolumeOn: boolean;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface CreateOrderResponse {
    orderId: OrderId;
    currency: string;
    razorpayOrder?: RazorpayOrderDetails;
    amount: bigint;
}
export interface SendTemplateEmailRequest {
    templateId: EmailTemplateId;
    orderId: string;
    customVariables: Array<[string, string]>;
}
export interface Lead {
    id: string;
    status: string;
    subject: string;
    name: string;
    createdAt: bigint;
    email: string;
    message: string;
    phone: string;
}
export interface CommunicationMessage {
    direction: MessageDirection;
    body: string;
    isRead: boolean;
    author?: string;
    timestamp: bigint;
}
export interface RequestOtpResponse {
    message: string;
    success: boolean;
}
export interface VerifyOtpRequest {
    otp: string;
    name: string;
    email: string;
    phone: string;
}
export interface AuthResult {
    message: string;
    success: boolean;
}
export interface CheckoutLeadInput {
    productIds: Array<string>;
    name: string;
    phone: string;
}
export interface WebsiteSettings {
    primaryColor: string;
    heroVideoIds: Array<string>;
    instagramUrl: string;
    siteName: string;
    whatsappNumber: string;
    logoUrl: string;
    contactEmail: string;
    secondaryColor: string;
    contactPhone: string;
}
export interface BrowseLeadInput {
    name: string;
    recipient?: string;
    productInterest?: string;
    phone: string;
}
export interface CartLead {
    id: bigint;
    status: string;
    leadType: LeadType;
    productIds: Array<string>;
    name: string;
    createdAt: bigint;
    recipient?: string;
    productName: string;
    email: string;
    assignedRep?: string;
    productInterest?: string;
    phone: string;
}
export interface AdminEmailConfig {
    isEnabled: boolean;
    fromName: string;
    adminEmail: string;
    replyTo: string;
}
export interface Order {
    razorpayPaymentId?: string;
    customerName: string;
    photoKeys: Array<ExternalBlob>;
    deliveryAddress?: DeliveryAddress;
    portraitType: PortraitType;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    selectedAddOns?: string;
    portraitTypeText?: string;
    customerPhone: string;
    orderStatus: OrderStatus;
    createdAt: Timestamp;
    is3DModel: boolean;
    estimatedDelivery: Timestamp;
    cartoonStyle: string;
    estimatedDeliveryText: string;
    isRead: boolean;
    customerAcknowledged: boolean;
    orderId: OrderId;
    specialInstructions?: string;
    referredBy?: string;
    upiRef?: string;
    razorpayOrderId?: string;
    totalAmount: bigint;
    address: string;
    notes: string;
    advancePaid: bigint;
    artStyle: ArtStyle;
    paymentMode: PaymentMode;
    customerId?: string;
    addOnsAmount: bigint;
    finalArtworkKey?: ExternalBlob;
    pincode: string;
    paymentRef?: string;
    amount: bigint;
    customerEmail: string;
    portraitPrice: bigint;
    orderItems: Array<OrderItem>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface AddonProduct {
    id: string;
    displayOrder: bigint;
    name: string;
    description?: string;
    codEnabled: boolean;
    imageUrl: string;
    category: string;
    price: bigint;
}
export type CustomerId = bigint;
export interface SalesRep {
    principal: string;
    name?: string;
    email?: string;
    addedAt: bigint;
    phone?: string;
}
export interface EmailTemplate {
    id: EmailTemplateId;
    subject: string;
    body: string;
    name: string;
    isActive: boolean;
    variables: Array<string>;
    category: string;
}
export interface ConfirmPaymentResponse {
    orderId: OrderId;
}
export interface Notification {
    id: string;
    title: string;
    notificationType: NotificationType;
    link?: string;
    isRead: boolean;
    orderId?: string;
    logId?: string;
    message: string;
    timestamp: bigint;
}
export interface CartItem {
    name: string;
    productId: string;
    flowType: string;
    quantity: bigint;
    image: string;
    price: bigint;
    itemImages: Array<string>;
}
export type Timestamp = bigint;
export interface CartResponse {
    cart?: Cart;
    message: string;
    success: boolean;
}
export interface UpdateCustomerRequest {
    name: string;
    phone: string;
}
export interface OrderItem {
    name: string;
    productId: string;
    flowType: string;
    quantity: bigint;
    price: bigint;
    itemImages: Array<string>;
}
export interface CartLeadInput {
    leadType: LeadType;
    productIds: Array<string>;
    name: string;
    productName: string;
    email: string;
    phone: string;
}
export interface MobileWebAppSettings {
    appName: string;
    primaryColor: string;
    splashScreenUrl: string;
    heroVideoIds: Array<string>;
    secondaryColor: string;
}
export interface RazorpayOrderDetails {
    orderId: string;
    currency: string;
    amount: bigint;
    keyId: string;
}
export interface GalleryImage {
    id: string;
    title: string;
    displayOrder: bigint;
    isActive: boolean;
    imageUrl: string;
    uploadedAt: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface Cart {
    id: string;
    createdAt: string;
    updatedAt: string;
    customerId?: string;
    sessionId: string;
    items: Array<CartItem>;
}
export type SalesRepList = Array<SalesRep>;
export interface DeliveryAddress {
    country: string;
    city: string;
    fullName: string;
    state: string;
    addressLine1: string;
    addressLine2: string;
    pincode: string;
}
export interface Review {
    id: string;
    status: ReviewStatus;
    name: string;
    createdAt: bigint;
    text: string;
    updatedAt: bigint;
    imageUrl?: string;
    rating: bigint;
}
export interface VerifyOtpResponse {
    token?: string;
    customer?: Customer;
    message: string;
    success: boolean;
}
export type EmailTemplateId = string;
export interface CustomerWithOrders {
    customer: Customer;
    orderCount: bigint;
}
export interface Customer {
    id: CustomerId;
    name: string;
    createdAt: bigint;
    email: string;
    updatedAt: bigint;
    phone: string;
}
export type SendTemplateEmailResponse = {
    __kind__: "ok";
    ok: CommunicationLog;
} | {
    __kind__: "err";
    err: string;
};
export interface RequestOtpRequest {
    phone: string;
}
export interface TeamMember {
    id: string;
    displayOrder: bigint;
    name: string;
    role: string;
    isActive: boolean;
    imageUrl: string;
    uploadedAt: bigint;
}
export interface CreateOrderRequest {
    customerName: string;
    photoKeys: Array<ExternalBlob>;
    deliveryAddress: DeliveryAddress;
    portraitType: string;
    paymentMethod: PaymentMethod;
    selectedAddOns: string;
    customerPhone: string;
    is3DModel: boolean;
    cartoonStyle: string;
    customerAcknowledged: boolean;
    specialInstructions?: string;
    referredBy: string;
    address: string;
    notes: string;
    paymentMode: PaymentMode;
    customerId: string;
    addOnsAmount: bigint;
    pincode: string;
    customerEmail: string;
    portraitPrice: bigint;
    orderItems: Array<OrderItem>;
}
export interface HeroVideo {
    id: string;
    title: string;
    displayOrder: bigint;
    platform?: HeroPlatform;
    isActive: boolean;
    isDefault: boolean;
    videoUrl: string;
    uploadedAt: bigint;
}
export type OrderId = string;
export interface UpdateAdminEmailConfigRequest {
    isEnabled: boolean;
    fromName: string;
    adminEmail: string;
    replyTo: string;
}
export enum ArtStyle {
    FunnyExaggerated = "FunnyExaggerated",
    ProfessionalPortrait = "ProfessionalPortrait",
    CuteCartoon = "CuteCartoon",
    CoupleIllustration = "CoupleIllustration",
    Chibi = "Chibi",
    SoftAesthetic = "SoftAesthetic"
}
export enum EmailStatus {
    Failed = "Failed",
    Sent = "Sent",
    Pending = "Pending"
}
export enum HeroPlatform {
    Both = "Both",
    Website = "Website",
    Mobile = "Mobile"
}
export enum LeadType {
    Browse = "Browse",
    CartAbandon = "CartAbandon",
    Checkout = "Checkout"
}
export enum MessageDirection {
    Sent = "Sent",
    Received = "Received"
}
export enum NotificationType {
    Message = "Message",
    Order = "Order"
}
export enum OrderStatus {
    Delivered = "Delivered",
    Received = "Received",
    Shipped = "Shipped",
    OutForDelivery = "OutForDelivery",
    InProgress = "InProgress",
    Completed = "Completed"
}
export enum PaymentMethod {
    COD = "COD",
    Razorpay = "Razorpay"
}
export enum PaymentMode {
    Full = "Full",
    Advance = "Advance"
}
export enum PaymentStatus {
    Failed = "Failed",
    Paid = "Paid",
    AdvancePaid = "AdvancePaid",
    Pending = "Pending"
}
export enum PortraitType {
    Couple = "Couple",
    Family = "Family",
    Group = "Group",
    Single = "Single"
}
export enum ReviewStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomerReply(orderId: OrderId, templateId: EmailTemplateId, body: string): Promise<SendTemplateEmailResponse>;
    addCustomerReplyPublic(orderId: OrderId, message: string, senderEmail: string): Promise<SendTemplateEmailResponse>;
    addGalleryImage(title: string, imageUrl: string): Promise<GalleryImage>;
    addHeroVideo(title: string, videoUrl: string, platform: HeroPlatform): Promise<HeroVideo>;
    addProduct(name: string, price: bigint, category: string, imageUrl: string, codEnabled: boolean, description: string | null): Promise<string>;
    addReview(name: string, text: string, rating: bigint, imageUrl: string | null): Promise<Review>;
    addSalesRep(principal: string, email: string | null, name: string | null, phone: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addTeamMember(name: string, role: string, imageUrl: string): Promise<TeamMember>;
    addToCart(sessionId: string, customerId: string | null, item: CartItem): Promise<CartResponse>;
    approveReview(id: string): Promise<Review | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignLeadToRep(cartLeadId: bigint, repPrincipal: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearCart(sessionId: string, customerId: string | null): Promise<CartResponse>;
    confirmRazorpayPayment(orderId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmUpiPayment(orderId: string, upiRef: string): Promise<{
        __kind__: "ok";
        ok: ConfirmPaymentResponse;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createBulkOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
    createCart(sessionId: string): Promise<CartResponse>;
    createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
    deleteCartLead(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteGalleryImage(id: string): Promise<boolean>;
    deleteHeroVideo(id: string): Promise<boolean>;
    deleteLead(id: string): Promise<boolean>;
    deleteMessage(logId: string, messageIndex: bigint): Promise<void>;
    deleteOrder(orderId: OrderId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteProduct(id: string): Promise<boolean>;
    deleteReview(id: string): Promise<boolean>;
    deleteTeamMember(id: string): Promise<boolean>;
    getActiveGalleryImages(): Promise<Array<GalleryImage>>;
    getActiveHeroVideos(): Promise<Array<HeroVideo>>;
    getActiveHeroVideosByPlatform(_platform: HeroPlatform): Promise<Array<HeroVideo>>;
    getActiveTeamMembers(): Promise<Array<TeamMember>>;
    getAdminEmailConfig(): Promise<AdminEmailConfig>;
    getAllCustomersWithOrders(): Promise<Array<CustomerWithOrders>>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(sessionId: string, customerId: string | null): Promise<CartResponse>;
    getCartLeads(): Promise<Array<CartLead>>;
    getCustomer(token: string): Promise<Customer | null>;
    getCustomerCount(): Promise<bigint>;
    getEmailTemplate(id: EmailTemplateId): Promise<EmailTemplate | null>;
    getGalleryImages(): Promise<Array<GalleryImage>>;
    getHeroVideoSettings(): Promise<HeroVideoSettings>;
    getHeroVideos(): Promise<Array<HeroVideo>>;
    getMobileWebAppSettings(): Promise<MobileWebAppSettings>;
    getOrder(orderId: OrderId): Promise<Order | null>;
    getOrdersByCustomer(customerId: string): Promise<Array<Order>>;
    getProduct(id: string): Promise<AddonProduct | null>;
    getPublicCommunicationLogs(orderId: OrderId): Promise<Array<CommunicationLog>>;
    getPublicReviews(): Promise<Array<[string, Review]>>;
    getRazorpayCheckoutPayload(orderId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getRazorpayKeyId(): Promise<string | null>;
    getRazorpayPublicKeyId(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getRecentNotifications(limit: bigint): Promise<Array<Notification>>;
    getTeamMembers(): Promise<Array<TeamMember>>;
    getUnreadMessagesCount(): Promise<bigint>;
    getUnreadOrdersCount(): Promise<bigint>;
    getWebsiteSettings(): Promise<WebsiteSettings>;
    isCallerAdmin(): Promise<boolean>;
    isCallerFounder(): Promise<boolean>;
    isCallerSalesRep(): Promise<boolean>;
    linkAnonymousOrders(email: string, phone: string, customerId: string): Promise<bigint>;
    listAllCommunicationLogs(): Promise<Array<CommunicationLog>>;
    listAllOrders(): Promise<Array<Order>>;
    listCommunicationLogs(orderId: OrderId): Promise<Array<CommunicationLog>>;
    listEmailTemplates(): Promise<Array<EmailTemplate>>;
    listLeads(): Promise<Array<Lead>>;
    listPendingReviews(): Promise<Array<[string, Review]>>;
    listProducts(): Promise<Array<AddonProduct>>;
    listReviews(): Promise<Array<[string, Review]>>;
    listSalesReps(): Promise<SalesRepList>;
    logout(token: string): Promise<AuthResult>;
    markMessageAsRead(logId: string, messageIndex: bigint): Promise<void>;
    markOrderAsSeen(orderId: string): Promise<void>;
    mergeCarts(fromSessionId: string, toCustomerId: string): Promise<CartResponse>;
    moveProductDown(id: string): Promise<void>;
    moveProductUp(id: string): Promise<void>;
    rejectReview(id: string): Promise<Review | null>;
    removeFromCart(sessionId: string, customerId: string | null, productId: string): Promise<CartResponse>;
    removeSalesRep(principal: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reorderProducts(orderedIds: Array<string>): Promise<void>;
    reorderTeamMembers(ids: Array<string>): Promise<void>;
    requestOTP(req: RequestOtpRequest): Promise<RequestOtpResponse>;
    saveBrowseLead(input: BrowseLeadInput): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCartLead(input: CartLeadInput): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCheckoutLead(input: CheckoutLeadInput): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveLead(name: string, phone: string, email: string, subject: string, message: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveRazorpayKeys(keyId: string, keySecret: string): Promise<boolean>;
    seedDefaultProducts(): Promise<bigint>;
    sendCustomEmail(orderId: OrderId, subject: string, body: string): Promise<SendTemplateEmailResponse>;
    sendPaymentReminder(orderId: OrderId): Promise<SendTemplateEmailResponse>;
    sendTemplateEmail(req: SendTemplateEmailRequest): Promise<SendTemplateEmailResponse>;
    setHeroVideoSettings(keepVolumeOn: boolean, autoplay: boolean, loopEnabled: boolean, muted: boolean): Promise<HeroVideoSettings>;
    submitReview(name: string, text: string, rating: bigint, imageUrl: string | null): Promise<Review>;
    teamListCartLeads(): Promise<Array<CartLead>>;
    teamListLeads(): Promise<Array<Lead>>;
    teamListOrders(): Promise<Array<Order>>;
    teamListProducts(): Promise<Array<AddonProduct>>;
    teamUpdateCartLeadStatus(id: bigint, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    teamUpdateLeadStatus(id: string, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleProductCOD(id: string, codEnabled: boolean): Promise<string>;
    toggleTemplateActive(id: EmailTemplateId, isActive: boolean): Promise<void>;
    transform(raw: TransformationInput): Promise<TransformationOutput>;
    updateAdminEmailConfig(req: UpdateAdminEmailConfigRequest): Promise<void>;
    updateCartLeadStatus(id: bigint, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateCustomer(token: string, req: UpdateCustomerRequest): Promise<AuthResult>;
    updateEmailTemplate(id: EmailTemplateId, template: EmailTemplate): Promise<void>;
    updateGalleryImage(id: string, title: string, displayOrder: bigint, isActive: boolean): Promise<GalleryImage | null>;
    updateHeroVideo(id: string, isActive: boolean, isDefault: boolean, displayOrder: bigint, platform: HeroPlatform): Promise<HeroVideo | null>;
    updateLeadStatus(id: string, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMobileWebAppSettings(settings: MobileWebAppSettings): Promise<MobileWebAppSettings>;
    updateOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
    updatePaymentStatus(orderId: OrderId, paymentStatus: PaymentStatus): Promise<void>;
    updateProduct(id: string, name: string, price: bigint, category: string, imageUrl: string, codEnabled: boolean, description: string | null): Promise<boolean>;
    updateProductImage(id: string, imageUrl: string): Promise<boolean>;
    updateQuantity(sessionId: string, customerId: string | null, productId: string, quantity: bigint): Promise<CartResponse>;
    updateReview(id: string, name: string, text: string, rating: bigint, imageUrl: string | null, status: ReviewStatus | null): Promise<Review | null>;
    updateTeamMember(id: string, name: string, role: string, imageUrl: string, displayOrder: bigint, isActive: boolean): Promise<TeamMember | null>;
    updateWebsiteSettings(settings: WebsiteSettings): Promise<WebsiteSettings>;
    uploadFinalArtwork(orderId: OrderId, artworkKey: ExternalBlob): Promise<void>;
    verifyOTP(req: VerifyOtpRequest): Promise<VerifyOtpResponse>;
}
