export enum PortraitType {
  Single = "single",
  Couple = "couple",
  Family = "family",
  Group = "group",
}

export enum ArtStyle {
  CuteCartoon = "cute_cartoon",
  ProfessionalPortrait = "professional_portrait",
  SoftAesthetic = "soft_aesthetic",
  FunnyExaggerated = "funny_exaggerated",
  CoupleIllustration = "couple_illustration",
  Chibi = "chibi",
}

export enum CartoonStyle {
  Digital = "Digital Cartoon",
  ThreeD = "3D Cartoon",
  Chibi = "Chibi Cartoon",
  Caricature = "Caricature Cartoon",
}

export const CARTOON_STYLE_OPTIONS = [
  CartoonStyle.Digital,
  CartoonStyle.ThreeD,
  CartoonStyle.Chibi,
  CartoonStyle.Caricature,
] as const;

export enum PaymentStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
  Refunded = "refunded",
  AdvancePaid = "advance_paid",
  PartialPaid = "partial_paid",
}

export enum OrderStatus {
  Received = "received",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum PaymentMode {
  Full = "Full",
  Advance = "Advance",
}

export interface ExternalBlob {
  getDirectURL(): string;
  directURL?: string;
}

export interface Order {
  orderId: string;
  customerName: string;
  customerEmail: string;
  portraitType: PortraitType;
  artStyle: ArtStyle;
  notes: string;
  photoKeys: ExternalBlob[];
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: bigint;
  estimatedDelivery: bigint;
  finalArtworkKey?: string;
  cartoonStyle?: string;
  customerAcknowledged?: boolean;
  paymentMode?: PaymentMode;
  totalAmount?: bigint;
  advancePaid?: bigint;
  amount?: bigint;
  addOnsAmount?: bigint;
  portraitPrice?: bigint;
  deliveryAddress?: {
    fullName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  selectedAddOns?: string;
  orderItems?: Array<{
    productId: string;
    name: string;
    quantity: bigint;
    price: bigint;
    itemImages: unknown[];
    flowType?: string;
  }>;
  customerPhone?: string;
  razorpayPaymentId?: string;
  upiRef?: string;
  paymentRef?: string;
  referredBy?: string;
  estimatedDeliveryText?: string;
}

export enum ReviewStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  imageUrl?: string;
  status: ReviewStatus;
  createdAt: bigint;
  updatedAt: bigint;
}

export function convertBackendReview(
  backendReview: import("@/backend").Review,
): Review {
  return {
    ...backendReview,
    rating: Number(backendReview.rating),
  };
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: bigint;
  status: string;
}

// Product catalog types
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  codEnabled: boolean;
  description?: string;
}

export type ProductCategory =
  | "Merchandise"
  | "Prints & Frames"
  | "LED & Glass"
  | "3D Model"
  | "Miniatures"
  | "Corporate Gifts"
  | "Ready to Ship"
  | "Custom Figurines"
  | "Photo Gifts";

export const GIFT_CATEGORIES: ProductCategory[] = [
  "Merchandise",
  "Prints & Frames",
  "LED & Glass",
];

export const MODEL_3D_CATEGORY: ProductCategory = "3D Model";

export const AVAILABLE_MODELS_CATEGORY = "Available Models";

// Cart / checkout types
export interface CartCheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  flowType: string;
}

export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  pincode: string;
  photoFiles: File[];
  notes: string;
  is3DModel: boolean;
  customerAcknowledged: boolean;
  paymentMode?: PaymentMode;
}

export interface BuyNowItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  flowType: string;
}

export interface CartLead {
  id: bigint;
  name: string;
  phone: string;
  email: string;
  productName: string;
  createdAt: bigint;
  status: string;
  leadType?: string;
  productIds?: string[];
  productInterest?: string;
  recipient?: string;
  assignedRep?: string;
}

export interface CartLeadInput {
  name: string;
  phone: string;
  email: string;
  productName: string;
}

export enum LeadType {
  CartAbandon = "CartAbandon",
  Checkout = "Checkout",
  Browse = "Browse",
}

export interface CheckoutLeadInput {
  name: string;
  phone: string;
  productIds: string[];
}

export interface BrowseLeadInput {
  name: string;
  phone: string;
  productInterest?: string;
  recipient?: string;
}

export interface BrowseLeadCapture {
  name: string;
  phone: string;
  productInterest: string;
  recipient: string;
  flowType: string;
  capturedAt: string;
}

export const BROWSE_LEAD_STORAGE_KEY = "browse_lead_capture";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  displayOrder: bigint;
  isActive: boolean;
  uploadedAt: bigint;
}

export interface SalesRep {
  principal: string;
  email?: string;
  name?: string;
  phone?: string;
  addedAt: bigint;
}
