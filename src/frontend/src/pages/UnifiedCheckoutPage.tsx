import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/context/CartContext";
import { useSaveCheckoutLead } from "@/hooks/useAdmin";
import { computeCartTotal, useCartGet } from "@/hooks/useCart";
import { useOrder } from "@/hooks/useOrder";
import { formatPrice } from "@/lib/utils";
import {
  BROWSE_LEAD_STORAGE_KEY,
  type BrowseLeadCapture,
  PaymentMode,
} from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  PackageOpen,
  ShoppingBag,
  Upload,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  flowType?: string;
}

interface ImageUpload {
  file: File | null;
  preview: string | null;
  progress: number;
}

export default function UnifiedCheckoutPage() {
  const { buyNowItem: contextBuyNowItem } = useCartContext();
  const navigate = useNavigate();
  const { data: cartData, isLoading: cartLoading } = useCartGet();
  const {
    formData,
    updateFormData,
    createOrder,
    createBulkOrder,
    openRazorpayCheckout,
    paymentError,
    setPaymentError,
  } = useOrder();

  const search = useSearch({ from: "/checkout" });
  const isBuyNow = search?.mode === "buynow";

  // Resolve buy-now item from CartContext first, then fall back to URL state
  const buyNowItem: CheckoutItem | null = useMemo(() => {
    if (!isBuyNow) return null;
    // Prefer CartContext
    if (contextBuyNowItem) {
      return {
        productId: contextBuyNowItem.productId,
        name: contextBuyNowItem.name,
        price: Number(contextBuyNowItem.price) / 100,
        quantity: 1,
        image: contextBuyNowItem.image,
        flowType: contextBuyNowItem.flowType,
      };
    }
    // Fall back to URL state
    if (!search?.item) return null;
    try {
      const parsed = JSON.parse(String(search.item)) as {
        productId?: string;
        name?: string;
        price?: number;
        quantity?: number;
        image?: string;
        flowType?: string;
      };
      if (!parsed.productId || !parsed.name) return null;
      return {
        productId: parsed.productId,
        name: parsed.name,
        price: Number(parsed.price ?? 0) / 100,
        quantity: Number(parsed.quantity ?? 1),
        image: parsed.image ?? "",
        flowType: parsed.flowType ?? "gift",
      };
    } catch {
      return null;
    }
  }, [isBuyNow, contextBuyNowItem, search]);

  const is3DModel = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return (
        buyNowItem.flowType === "3d" ||
        buyNowItem.flowType === "3D Model" ||
        buyNowItem.flowType === "3d_model" ||
        buyNowItem.name.toLowerCase().includes("3d") ||
        buyNowItem.name.toLowerCase().includes("miniature")
      );
    }
    const cartItems = cartData?.cart?.items ?? [];
    return cartItems.some(
      (item) =>
        item.flowType === "3d" ||
        item.flowType === "3D Model" ||
        item.flowType === "3d_model" ||
        item.name.toLowerCase().includes("3d") ||
        item.name.toLowerCase().includes("miniature"),
    );
  }, [isBuyNow, buyNowItem, cartData]);

  // Available Models flow: ready-to-ship products with NO image upload step.
  // Detected via flowType or item name/category indicating Available Models.
  const isAvailableModels = useMemo(() => {
    const matchesItem = (item: { flowType?: string; name: string }) =>
      item.flowType === "available_models" ||
      item.name.toLowerCase().includes("available models");
    if (isBuyNow && buyNowItem) return matchesItem(buyNowItem);
    const cartItems = cartData?.cart?.items ?? [];
    return cartItems.length > 0 && cartItems.every(matchesItem);
  }, [isBuyNow, buyNowItem, cartData]);

  const items: CheckoutItem[] = useMemo(() => {
    if (isBuyNow && buyNowItem) return [buyNowItem];
    return (cartData?.cart?.items ?? []).map((item) => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price) / 100,
      quantity: Number(item.quantity),
      image: item.image,
      flowType: item.flowType,
    }));
  }, [isBuyNow, buyNowItem, cartData]);

  const total = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return buyNowItem.price * buyNowItem.quantity;
    }
    return computeCartTotal(cartData?.cart?.items ?? []);
  }, [isBuyNow, buyNowItem, cartData]);

  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>(
    PaymentMode.Full,
  );
  // Available Models flow only supports full payment — force Full whenever
  // the current checkout flow is Available Models (defensive: state defaults
  // to Full, but this guarantees correctness if it ever drifts).
  useEffect(() => {
    if (isAvailableModels) setSelectedPaymentMode(PaymentMode.Full);
  }, [isAvailableModels]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const leadCapturedRef = useRef(false);
  const saveCheckoutLead = useSaveCheckoutLead();

  // Keep a ref to formData so the one-time mount pre-fill effect can read the
  // latest customerName/customerPhone values without listing formData as a
  // dependency (which would re-trigger the pre-fill on every keystroke).
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const advanceNow = useMemo(() => total * 0.5, [total]);
  const advanceRemaining = useMemo(
    () => total - advanceNow,
    [total, advanceNow],
  );

  // Silent lead capture: trigger once per session when name, phone, email, and address are all filled
  useEffect(() => {
    const hasName = formData.customerName.trim().length > 0;
    const hasPhone = /^\+?[\d\s\-]{10,15}$/.test(formData.customerPhone.trim());
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.customerEmail.trim(),
    );
    const hasAddress = formData.address.trim().length > 0;

    if (
      hasName &&
      hasPhone &&
      hasEmail &&
      hasAddress &&
      !leadCapturedRef.current
    ) {
      leadCapturedRef.current = true;
      const productIds = items.map((item) => item.productId);
      saveCheckoutLead.mutate(
        {
          name: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
          productIds,
        },
        {
          onError: () => {
            // Silently fail — no UI change on capture failure
            leadCapturedRef.current = false;
          },
        },
      );
    }
  }, [
    formData.customerName,
    formData.customerPhone,
    formData.customerEmail,
    formData.address,
    items,
    saveCheckoutLead,
  ]);

  // Load saved details from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unified_checkout_details");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.customerName)
          updateFormData({ customerName: data.customerName });
        if (data.customerPhone)
          updateFormData({ customerPhone: data.customerPhone });
        if (data.customerEmail)
          updateFormData({ customerEmail: data.customerEmail });
        if (data.address) updateFormData({ address: data.address });
        if (data.pincode) updateFormData({ pincode: data.pincode });
      }
    } catch {
      // ignore
    }

    // Pre-fill name and phone from the Browse Lead capture when the customer
    // arrives from the Available Models or Order 3D Model flows. Only fills
    // fields that are still empty after the unified_checkout_details load
    // above, so previously-saved checkout details take precedence. The
    // fields remain fully editable — the customer can correct them.
    if (!isAvailableModels && !is3DModel) return;
    try {
      const raw = localStorage.getItem(BROWSE_LEAD_STORAGE_KEY);
      if (!raw) return;
      const capture = JSON.parse(raw) as Partial<BrowseLeadCapture>;
      const current = formDataRef.current;
      if (capture.name && !current.customerName.trim())
        updateFormData({ customerName: capture.name });
      if (capture.phone && !current.customerPhone.trim())
        updateFormData({ customerPhone: capture.phone });
    } catch {
      // ignore malformed capture
    }
  }, [updateFormData, isAvailableModels, is3DModel]);

  const saveDetails = () => {
    localStorage.setItem(
      "unified_checkout_details",
      JSON.stringify({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        address: formData.address,
        pincode: formData.pincode,
      }),
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        toast.error(`${file.name} is not a valid image (JPG, PNG, or WebP)`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    const newUploads: ImageUpload[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setImages((prev) => [...prev, ...newUploads]);
    updateFormData({
      photoFiles: [...formData.photoFiles, ...validFiles],
    });
    if (errors.images) setErrors((p) => ({ ...p, images: "" }));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index]?.preview) {
        URL.revokeObjectURL(next[index].preview!);
      }
      next.splice(index, 1);
      return next;
    });
    updateFormData({
      photoFiles: formData.photoFiles.filter((_, i) => i !== index),
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.customerName.trim()) errs.name = "Full name is required";
    if (!formData.customerPhone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-]{10,15}$/.test(formData.customerPhone.trim()))
      errs.phone = "Please enter a valid phone number";
    if (!formData.customerEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim()))
      errs.email = "Please enter a valid email address";
    if (!formData.address.trim()) errs.address = "Address is required";
    if (!formData.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode.trim()))
      errs.pincode = "Please enter a valid 6-digit pincode";
    // Image upload is required for custom flows (3D / standard) but NOT for
    // the Available Models ready-to-ship flow.
    if (!isAvailableModels && images.length === 0)
      errs.images = "Please upload at least one image";
    if (is3DModel && !formData.customerAcknowledged)
      errs.ack = "Please acknowledge the terms to proceed";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const allRequiredFilled = useMemo(() => {
    const hasName = formData.customerName.trim().length > 0;
    const hasPhone = /^\+?[\d\s\-]{10,15}$/.test(formData.customerPhone.trim());
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.customerEmail.trim(),
    );
    const hasAddress = formData.address.trim().length > 0;
    const hasPincode = /^\d{6}$/.test(formData.pincode.trim());
    const hasImages = isAvailableModels || images.length > 0;
    const hasAck = is3DModel ? formData.customerAcknowledged : true;
    return (
      hasName &&
      hasPhone &&
      hasEmail &&
      hasAddress &&
      hasPincode &&
      hasImages &&
      hasAck
    );
  }, [formData, images, is3DModel, isAvailableModels]);

  const handleProceedToPay = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);
    saveDetails();

    try {
      // Sync local image state and address into formData before order creation.
      // Available Models flow skips image upload entirely and is never a 3D model.
      updateFormData({
        photoFiles: isAvailableModels
          ? []
          : (images.map((img) => img.file).filter(Boolean) as File[]),
        deliveryAddress: {
          ...formData.deliveryAddress,
          fullName: formData.customerName.trim(),
          addressLine1: formData.address.trim(),
          pincode: formData.pincode.trim(),
          country: "India",
        },
        is3DModel: isAvailableModels ? false : is3DModel,
      });

      const orderItems = items.map((item) => ({
        name: item.name,
        productId: item.productId,
        flowType: isAvailableModels
          ? "available_models"
          : item.flowType || "gift",
        quantity: BigInt(item.quantity),
        price: BigInt(Math.round(item.price * 100)),
        itemImages: [],
      }));

      console.log(
        "[UnifiedCheckoutPage] orderItems being sent to backend:",
        JSON.stringify(orderItems, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
      console.log(
        "[UnifiedCheckoutPage] orderItems length:",
        orderItems.length,
      );
      if (orderItems.length === 0) {
        throw new Error(
          "No order items to submit. Please add items to your cart.",
        );
      }

      // Use useOrder mutations instead of calling actor directly
      let result: import("@/backend").CreateOrderResponse;
      if (isBuyNow) {
        result = await createOrder.mutateAsync({
          addOnsAmount: Math.round(total * 100),
          orderItems,
          paymentMode: selectedPaymentMode,
        });
      } else {
        result = await createBulkOrder.mutateAsync({
          addOnsAmount: Math.round(total * 100),
          orderItems,
          paymentMode: selectedPaymentMode,
        });
      }

      console.log(
        "[UnifiedCheckoutPage] createOrder/createBulkOrder result:",
        result,
      );
      console.log("[UnifiedCheckoutPage] razorpayOrder:", result.razorpayOrder);

      const newOrderId = result.orderId ?? "";
      if (!newOrderId) {
        throw new Error("Failed to create order. Please try again.");
      }

      if (!result.razorpayOrder) {
        throw new Error("Payment initialization failed. Please try again.");
      }

      toast.success("Order created! Opening payment…");
      await openRazorpayCheckout(
        result.razorpayOrder,
        formData.customerName.trim() || "Customer",
        formData.customerEmail.trim(),
        "Cherishables Custom Artwork",
        newOrderId,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create order";
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading && !isBuyNow) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4"
        data-ocid="unified_checkout.page.empty_state"
      >
        <PackageOpen className="h-20 w-20 text-muted-foreground/30" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mt-2">
            Add some keepsakes to get started
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          data-ocid="unified_checkout.continue_shopping"
          onClick={() => navigate({ to: "/shop" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {isBuyNow ? "Buy Now Checkout" : "Checkout"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Order Summary + Customer Details + Image Upload */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Summary */}
          <section data-ocid="unified_checkout.item_list">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Order Summary ({itemCount} {itemCount === 1 ? "item" : "items"})
            </h2>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <Card
                  key={item.productId}
                  data-ocid={`unified_checkout.item.${idx + 1}`}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className="h-24 w-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.flowType}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary whitespace-nowrap">
                          {formatPrice(
                            Number(item.price) * Number(item.quantity),
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Quantity: {Number(item.quantity)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Customer Details Form */}
          <section data-ocid="unified_checkout.customer_form">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Customer Details
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="uc-name"
                    className="text-foreground font-medium"
                  >
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uc-name"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => {
                      updateFormData({ customerName: e.target.value });
                      if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={errors.name ? "border-destructive" : ""}
                    data-ocid="unified_checkout.name_input"
                  />
                  {errors.name && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.name.field_error"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="uc-phone"
                    className="text-foreground font-medium"
                  >
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uc-phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      updateFormData({ customerPhone: e.target.value });
                      if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className={errors.phone ? "border-destructive" : ""}
                    data-ocid="unified_checkout.phone_input"
                  />
                  {errors.phone && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.phone.field_error"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="uc-email"
                    className="text-foreground font-medium"
                  >
                    Email ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uc-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.customerEmail}
                    onChange={(e) => {
                      updateFormData({ customerEmail: e.target.value });
                      if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                    }}
                    className={errors.email ? "border-destructive" : ""}
                    data-ocid="unified_checkout.email_input"
                  />
                  {errors.email && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.email.field_error"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="uc-address"
                    className="text-foreground font-medium"
                  >
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uc-address"
                    placeholder="House no., Street, Area, City, State"
                    value={formData.address}
                    onChange={(e) => {
                      updateFormData({ address: e.target.value });
                      if (errors.address)
                        setErrors((p) => ({ ...p, address: "" }));
                    }}
                    className={errors.address ? "border-destructive" : ""}
                    data-ocid="unified_checkout.address_input"
                  />
                  {errors.address && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.address.field_error"
                    >
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="uc-pincode"
                    className="text-foreground font-medium"
                  >
                    Pincode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uc-pincode"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => {
                      updateFormData({
                        pincode: e.target.value.replace(/\D/g, ""),
                      });
                      if (errors.pincode)
                        setErrors((p) => ({ ...p, pincode: "" }));
                    }}
                    className={errors.pincode ? "border-destructive" : ""}
                    data-ocid="unified_checkout.pincode_input"
                  />
                  {errors.pincode && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.pincode.field_error"
                    >
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Image Upload — hidden for Available Models flow (no image upload option) */}
          {!isAvailableModels && (
            <section data-ocid="unified_checkout.image_upload_section">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Upload Reference Images{" "}
                <span className="text-destructive">*</span>
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please upload clear photos for reference. Multiple images
                    are allowed. This helps our artists create the best possible
                    artwork.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.file?.name ?? img.preview ?? `img-${idx}`}
                        className="relative h-20 w-20 rounded-lg overflow-hidden border border-border"
                        data-ocid={`unified_checkout.image_preview.${idx + 1}`}
                      >
                        <img
                          src={img.preview ?? ""}
                          alt={`Upload ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {img.progress > 0 && img.progress < 100 && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {img.progress}%
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                          data-ocid={`unified_checkout.remove_image_button.${idx + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <input
                      type="file"
                      id="uc-image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      data-ocid="unified_checkout.image_input"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("uc-image-upload")?.click()
                      }
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                      data-ocid="unified_checkout.upload_image_button"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        Add
                      </span>
                    </button>
                  </div>

                  {errors.images && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.images.field_error"
                    >
                      {errors.images}
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Special Instructions */}
          <section data-ocid="unified_checkout.special_instructions_section">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Special Instructions{" "}
              <span className="text-muted-foreground font-normal text-sm">
                (Optional)
              </span>
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add any special delivery instructions, packaging requests, or
                  other notes for your order.
                </p>
                <div className="space-y-1">
                  <Label
                    htmlFor="uc-special-instructions"
                    className="text-foreground font-medium"
                  >
                    Instructions
                  </Label>
                  <textarea
                    id="uc-special-instructions"
                    rows={3}
                    placeholder="Any special delivery instructions, packaging requests, or other notes..."
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      updateFormData({ specialInstructions: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    data-ocid="unified_checkout.special_instructions_input"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3D Model Customer Acknowledgment */}
          {is3DModel && (
            <section data-ocid="unified_checkout.acknowledgment_section">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Customer Acknowledgment
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please read and acknowledge the following terms before
                    proceeding with your 3D miniature order.
                  </p>

                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({
                          customerAcknowledged: !formData.customerAcknowledged,
                        });
                        if (errors.ack) setErrors((p) => ({ ...p, ack: "" }));
                      }}
                      className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        formData.customerAcknowledged
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      } ${errors.ack ? "border-destructive" : ""}`}
                      data-ocid="unified_checkout.ack_checkbox"
                      aria-pressed={formData.customerAcknowledged}
                    >
                      {formData.customerAcknowledged && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-foreground leading-relaxed cursor-pointer bg-transparent border-0 p-0 text-left"
                      onClick={() => {
                        updateFormData({
                          customerAcknowledged: !formData.customerAcknowledged,
                        });
                        if (errors.ack) setErrors((p) => ({ ...p, ack: "" }));
                      }}
                    >
                      I understand that this is a custom-made artistic miniature
                      and not a 100% exact replica of the reference photos. I
                      have reviewed and accepted the preview, understand that
                      custom orders are non-refundable after approval, and agree
                      to the Terms & Conditions before production begins.
                    </button>
                  </div>

                  {errors.ack && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="unified_checkout.ack.field_error"
                    >
                      {errors.ack}
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        {/* Right column: Order Summary + Proceed to Pay */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Order Summary
              </h2>
              <Separator />

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                    data-ocid={`unified_checkout.summary.item.${idx + 1}`}
                  >
                    <span className="text-muted-foreground truncate mr-2">
                      {item.name} × {Number(item.quantity)}
                    </span>
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Payment Mode Selection */}
              <div
                className="space-y-3"
                data-ocid="unified_checkout.payment_mode_section"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  Select Payment Option
                </h3>

                {/* Pay Full Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode(PaymentMode.Full)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                    selectedPaymentMode === PaymentMode.Full
                      ? "border-primary bg-primary/5 shadow-warm"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                  data-ocid="unified_checkout.pay_full_card"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedPaymentMode === PaymentMode.Full
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    >
                      {selectedPaymentMode === PaymentMode.Full && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap
                          className={`h-4 w-4 ${
                            selectedPaymentMode === PaymentMode.Full
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="font-semibold text-foreground text-sm">
                          Pay Full Amount
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Pay 100% of the order value. Production starts
                        immediately after payment.
                      </p>
                      <div className="mt-2 text-sm font-bold text-primary">
                        {formatPrice(total)}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Pay Advance Card — hidden for Available Models flow */}
                {!isAvailableModels && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode(PaymentMode.Advance)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                      selectedPaymentMode === PaymentMode.Advance
                        ? "border-primary bg-primary/5 shadow-warm"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                    data-ocid="unified_checkout.pay_advance_card"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedPaymentMode === PaymentMode.Advance
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedPaymentMode === PaymentMode.Advance && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Wallet
                            className={`h-4 w-4 ${
                              selectedPaymentMode === PaymentMode.Advance
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-semibold text-foreground text-sm">
                            Pay Advance (50%)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Pay only 50% to confirm your order. Remaining balance
                          is due before shipping.
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Pay now
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(advanceNow)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Remaining before shipping
                            </span>
                            <span className="font-medium text-foreground">
                              {formatPrice(advanceRemaining)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {paymentError && (
                <div
                  className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                  data-ocid="unified_checkout.payment_error"
                >
                  {paymentError}
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
                onClick={handleProceedToPay}
                disabled={
                  isSubmitting ||
                  !allRequiredFilled ||
                  createOrder.isPending ||
                  createBulkOrder.isPending
                }
                data-ocid="unified_checkout.proceed_to_pay_button"
              >
                {isSubmitting ||
                createOrder.isPending ||
                createBulkOrder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {selectedPaymentMode === PaymentMode.Full
                      ? `Pay Full ${formatPrice(total)}`
                      : `Pay Advance ${formatPrice(advanceNow)}`}
                  </>
                )}
              </Button>

              {!allRequiredFilled && (
                <p className="text-xs text-muted-foreground text-center">
                  {isAvailableModels
                    ? "Fill all required fields to proceed"
                    : "Fill all required fields and upload at least one image to proceed"}
                </p>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: isBuyNow ? "/shop" : "/cart" })}
                data-ocid="unified_checkout.back_button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isBuyNow ? "Back to Shop" : "Back to Cart"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
