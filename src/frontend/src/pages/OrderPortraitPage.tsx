import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/hooks/useOrder";
import { formatPrice } from "@/lib/utils";
import { CARTOON_STYLE_OPTIONS, PortraitType } from "@/types";
import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Loader2,
  Upload,
  User,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ImageUpload {
  file: File | null;
  preview: string | null;
  progress: number;
}

const PORTRAIT_PRICES: Record<string, number> = {
  single: 599,
  couple: 999,
  family: 1499,
  group: 1999,
};

const PORTRAIT_TYPE_LABELS: Record<string, string> = {
  single: "Single Portrait",
  couple: "Couple Portrait",
  family: "Family Portrait",
  group: "Group Portrait",
};

export default function OrderPortraitPage() {
  const {
    formData,
    updateFormData,
    createOrder,
    openRazorpayCheckout,
    uploadProgress,
    paymentError,
    setPaymentError,
  } = useOrder();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const portraitPrice = PORTRAIT_PRICES[formData.portraitType] ?? 599;
  const total = portraitPrice;

  const allRequiredFilled = useMemo(() => {
    const hasName = formData.customerName.trim().length > 0;
    const hasPhone = /^\+?[\d\s\-]{10,15}$/.test(formData.customerPhone.trim());
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.customerEmail.trim(),
    );
    const hasAddress = formData.address.trim().length > 0;
    const hasPincode = /^\d{6}$/.test(formData.pincode.trim());
    const hasImages = images.length > 0;
    const hasStyle = formData.cartoonStyle.trim().length > 0;
    return (
      hasName &&
      hasPhone &&
      hasEmail &&
      hasAddress &&
      hasPincode &&
      hasImages &&
      hasStyle
    );
  }, [formData, images]);

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
    updateFormData({ photoFiles: [...formData.photoFiles, ...validFiles] });
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
    if (images.length === 0) errs.images = "Please upload at least one photo";
    if (!formData.cartoonStyle.trim())
      errs.style = "Please select an art style";
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToPay = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      updateFormData({ portraitPrice });

      const result = await createOrder.mutateAsync({ addOnsAmount: 0 });

      if (!result.razorpayOrder) {
        throw new Error("Payment initialization failed. Please try again.");
      }

      toast.success("Order created! Opening payment…");
      await openRazorpayCheckout(
        result.razorpayOrder,
        formData.customerName.trim() || "Customer",
        formData.customerEmail.trim(),
        `Cherishables ${PORTRAIT_TYPE_LABELS[formData.portraitType] || "Portrait"}`,
        result.orderId ?? undefined,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create order";
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Camera className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
                Order a Portrait
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Transform your photos into beautiful custom portraits. Choose your
              style, upload your photos, and our artists will create something
              magical.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Portrait Details + Customer Details + Image Upload */}
          <div className="lg:col-span-2 space-y-8">
            {/* Portrait Details */}
            <section data-ocid="portrait.details_section">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Portrait Details
              </h2>
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Portrait Type */}
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Portrait Type
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.values(PortraitType).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            updateFormData({ portraitType: type });
                            if (errors.type)
                              setErrors((p) => ({ ...p, type: "" }));
                          }}
                          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.portraitType === type
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-foreground hover:border-primary/50"
                          }`}
                          data-ocid={`portrait.type_${type}.button`}
                        >
                          {PORTRAIT_TYPE_LABELS[type] || type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Art Style */}
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Art Style <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CARTOON_STYLE_OPTIONS.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            updateFormData({ cartoonStyle: style });
                            if (errors.style)
                              setErrors((p) => ({ ...p, style: "" }));
                          }}
                          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.cartoonStyle === style
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-foreground hover:border-primary/50"
                          }`}
                          data-ocid={`portrait.style_${style.replace(/\s+/g, "_").toLowerCase()}.button`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                    {errors.style && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.style.field_error"
                      >
                        {errors.style}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="portrait-notes"
                      className="text-foreground font-medium"
                    >
                      Special Notes
                    </Label>
                    <textarea
                      id="portrait-notes"
                      rows={3}
                      placeholder="Any specific requests, background preferences, or details for our artists..."
                      value={formData.notes}
                      onChange={(e) =>
                        updateFormData({ notes: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                      data-ocid="portrait.notes_input"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="portrait-special-instructions"
                      className="text-foreground font-medium"
                    >
                      Special Instructions{" "}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </Label>
                    <textarea
                      id="portrait-special-instructions"
                      rows={3}
                      placeholder="Any special delivery instructions, packaging requests, or other notes..."
                      value={formData.specialInstructions}
                      onChange={(e) =>
                        updateFormData({ specialInstructions: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                      data-ocid="portrait.special_instructions_input"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Customer Details */}
            <section data-ocid="portrait.customer_form">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Customer Details
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="portrait-name"
                      className="text-foreground font-medium"
                    >
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="portrait-name"
                      placeholder="Enter your full name"
                      value={formData.customerName}
                      onChange={(e) => {
                        updateFormData({ customerName: e.target.value });
                        if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                      }}
                      className={errors.name ? "border-destructive" : ""}
                      data-ocid="portrait.name_input"
                    />
                    {errors.name && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.name.field_error"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="portrait-phone"
                      className="text-foreground font-medium"
                    >
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="portrait-phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.customerPhone}
                      onChange={(e) => {
                        updateFormData({ customerPhone: e.target.value });
                        if (errors.phone)
                          setErrors((p) => ({ ...p, phone: "" }));
                      }}
                      className={errors.phone ? "border-destructive" : ""}
                      data-ocid="portrait.phone_input"
                    />
                    {errors.phone && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.phone.field_error"
                      >
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="portrait-email"
                      className="text-foreground font-medium"
                    >
                      Email ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="portrait-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.customerEmail}
                      onChange={(e) => {
                        updateFormData({ customerEmail: e.target.value });
                        if (errors.email)
                          setErrors((p) => ({ ...p, email: "" }));
                      }}
                      className={errors.email ? "border-destructive" : ""}
                      data-ocid="portrait.email_input"
                    />
                    {errors.email && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.email.field_error"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="portrait-address"
                      className="text-foreground font-medium"
                    >
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="portrait-address"
                      placeholder="House no., Street, Area, City, State"
                      value={formData.address}
                      onChange={(e) => {
                        updateFormData({ address: e.target.value });
                        if (errors.address)
                          setErrors((p) => ({ ...p, address: "" }));
                      }}
                      className={errors.address ? "border-destructive" : ""}
                      data-ocid="portrait.address_input"
                    />
                    {errors.address && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.address.field_error"
                      >
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="portrait-pincode"
                      className="text-foreground font-medium"
                    >
                      Pincode <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="portrait-pincode"
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
                      data-ocid="portrait.pincode_input"
                    />
                    {errors.pincode && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="portrait.pincode.field_error"
                      >
                        {errors.pincode}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Image Upload */}
            <section data-ocid="portrait.image_upload_section">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Upload Photos <span className="text-destructive">*</span>
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please upload clear photos for reference. Multiple images
                    are allowed. This helps our artists create the best possible
                    portrait.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.file?.name ?? img.preview ?? `img-${idx}`}
                        className="relative h-20 w-20 rounded-lg overflow-hidden border border-border"
                        data-ocid={`portrait.image_preview.${idx + 1}`}
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
                          data-ocid={`portrait.remove_image_button.${idx + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <input
                      type="file"
                      id="portrait-image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      data-ocid="portrait.image_input"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("portrait-image-upload")
                          ?.click()
                      }
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                      data-ocid="portrait.upload_image_button"
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
                      data-ocid="portrait.images.field_error"
                    >
                      {errors.images}
                    </p>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Uploading… {uploadProgress}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {PORTRAIT_TYPE_LABELS[formData.portraitType] ||
                        "Portrait"}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatPrice(portraitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Art Style</span>
                    <span className="font-medium text-foreground">
                      {formData.cartoonStyle || "—"}
                    </span>
                  </div>
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

                {paymentError && (
                  <div
                    className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                    data-ocid="portrait.payment_error"
                  >
                    {paymentError}
                  </div>
                )}

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
                  onClick={handleProceedToPay}
                  disabled={isSubmitting || !allRequiredFilled}
                  data-ocid="portrait.proceed_to_pay_button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Pay
                    </>
                  )}
                </Button>

                {!allRequiredFilled && (
                  <p className="text-xs text-muted-foreground text-center">
                    Fill all required fields, select a style, and upload at
                    least one image to proceed
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.history.back()}
                  data-ocid="portrait.back_button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
