import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveBrowseLead } from "@/hooks/useAdmin";
import { BROWSE_LEAD_STORAGE_KEY, type BrowseLeadCapture } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Loader2,
  Package,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface BrowseLeadModalProps {
  open: boolean;
  onClose: () => void;
  flowType: string;
}

type Recipient = "Yourself" | "Gift";

const TOTAL_STEPS = 4;

export function BrowseLeadModal({
  open,
  onClose,
  flowType,
}: BrowseLeadModalProps) {
  const [step, setStep] = useState(1);
  const [productInterest, setProductInterest] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{
    productInterest?: string;
    recipient?: string;
    name?: string;
    phone?: string;
  }>({});

  const saveBrowseLead = useSaveBrowseLead();
  const stepInputRef = useRef<HTMLInputElement>(null);
  // Tracks whether the form has been successfully submitted. The modal cannot
  // be dismissed (Escape, outside-click, or programmatic close) until this is
  // set true by the successful submit handler — the only path to onClose.
  const formCompletedRef = useRef(false);

  // Reset the form whenever the modal is (re)opened — modal appears fresh every visit
  useEffect(() => {
    if (open) {
      setStep(1);
      setProductInterest("");
      setRecipient(null);
      setName("");
      setPhone("");
      setErrors({});
      formCompletedRef.current = false;
    }
  }, [open]);

  // Focus the active step's input for accessibility — re-focus on step change
  // biome-ignore lint/correctness/useExhaustiveDependencies: step is intentionally tracked to refocus on navigation
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => stepInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: typeof errors = {};

    if (currentStep === 1 && !productInterest.trim()) {
      newErrors.productInterest = "Please tell us what you're looking for";
    }
    if (currentStep === 2 && !recipient) {
      newErrors.recipient = "Please choose an option";
    }
    if (currentStep === 3 && !name.trim()) {
      newErrors.name = "Name is required";
    }
    if (currentStep === 4) {
      if (!phone.trim()) {
        newErrors.phone = "WhatsApp number is required";
      } else if (!/^[\d\s\-+()]{7,20}$/.test(phone.trim())) {
        newErrors.phone = "Please enter a valid WhatsApp number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (currentStep: number): boolean => {
    if (currentStep === 1) return productInterest.trim().length > 0;
    if (currentStep === 2) return recipient !== null;
    if (currentStep === 3) return name.trim().length > 0;
    if (currentStep === 4) return /^[\d\s\-+()]{7,20}$/.test(phone.trim());
    return false;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const persistCapture = () => {
    const capture: BrowseLeadCapture = {
      name: name.trim(),
      phone: phone.trim(),
      productInterest: productInterest.trim(),
      recipient: recipient ?? "",
      flowType,
      capturedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(BROWSE_LEAD_STORAGE_KEY, JSON.stringify(capture));
    } catch {
      // localStorage may be unavailable (private mode); lead is still saved server-side
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    try {
      await saveBrowseLead.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        productInterest: productInterest.trim(),
        recipient: recipient ?? undefined,
      });

      persistCapture();
      formCompletedRef.current = true;

      toast.success("Thanks! You can now browse our collection.");
      setErrors({});
      onClose();
    } catch {
      toast.error("Failed to save details. Please try again.");
    }
  };

  // The modal must gate browsing until the form is submitted. Ignore every
  // close request (Escape, outside-click, programmatic) unless the form has
  // been successfully submitted — the only legitimate path to onClose.
  const handleOpenChange = (next: boolean) => {
    if (!next && !formCompletedRef.current) return;
    if (!next) onClose();
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-card border-border"
        data-ocid="browse_lead.modal"
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display text-2xl">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="gradient-text-gold">
              {"\u{1F381}"} Get Exact Price &amp; Preview
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Answer a few quick questions and we&apos;ll share the exact price
            and a preview for you.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2" data-ocid="browse_lead.progress">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-smooth ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
                data-ocid={`browse_lead.progress.segment.${s}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Step 1 — Product interest */}
          {step === 1 && (
            <div className="space-y-2 animate-fade-in" key="step-1">
              <Label
                htmlFor="browse-lead-product"
                className="text-foreground font-display text-lg"
              >
                Which product are you looking for?
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="browse-lead-product"
                  ref={stepInputRef}
                  placeholder="e.g. 3D crystal, custom portrait, LED frame..."
                  value={productInterest}
                  onChange={(e) => {
                    setProductInterest(e.target.value);
                    if (errors.productInterest)
                      setErrors((prev) => ({
                        ...prev,
                        productInterest: undefined,
                      }));
                  }}
                  className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground ${
                    errors.productInterest
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                  data-ocid="browse_lead.product_input"
                  autoComplete="off"
                />
              </div>
              {errors.productInterest && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="browse_lead.product_error"
                >
                  {errors.productInterest}
                </p>
              )}
            </div>
          )}

          {/* Step 2 — Yourself or Gift */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in" key="step-2">
              <Label className="text-foreground font-display text-lg">
                Is it for yourself or a gift?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "Yourself" as Recipient,
                    label: "Yourself",
                    desc: "A treat for me",
                    icon: User,
                  },
                  {
                    value: "Gift" as Recipient,
                    label: "Gift",
                    desc: "For someone special",
                    icon: Gift,
                  },
                ].map((opt) => {
                  const selected = recipient === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRecipient(opt.value);
                        if (errors.recipient)
                          setErrors((prev) => ({
                            ...prev,
                            recipient: undefined,
                          }));
                      }}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-smooth ${
                        selected
                          ? "border-primary bg-primary/5 shadow-warm"
                          : "border-border bg-background hover:border-accent"
                      }`}
                      data-ocid={`browse_lead.recipient.${opt.value.toLowerCase()}`}
                      aria-pressed={selected}
                    >
                      <Icon
                        className={`h-7 w-7 ${
                          selected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="font-display text-base text-foreground">
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.recipient && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="browse_lead.recipient_error"
                >
                  {errors.recipient}
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Name */}
          {step === 3 && (
            <div className="space-y-2 animate-fade-in" key="step-3">
              <Label
                htmlFor="browse-lead-name"
                className="text-foreground font-display text-lg"
              >
                Your name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="browse-lead-name"
                  ref={stepInputRef}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground ${
                    errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                  data-ocid="browse_lead.name_input"
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="browse_lead.name_error"
                >
                  {errors.name}
                </p>
              )}
            </div>
          )}

          {/* Step 4 — WhatsApp number */}
          {step === 4 && (
            <div className="space-y-2 animate-fade-in" key="step-4">
              <Label
                htmlFor="browse-lead-phone"
                className="text-foreground font-display text-lg"
              >
                WhatsApp number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="browse-lead-phone"
                  ref={stepInputRef}
                  type="tel"
                  placeholder="Your WhatsApp number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone)
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground ${
                    errors.phone
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                  data-ocid="browse_lead.phone_input"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll send your exact price and preview on WhatsApp.
              </p>
              {errors.phone && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="browse_lead.phone_error"
                >
                  {errors.phone}
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={saveBrowseLead.isPending}
                className="border-border text-foreground hover:bg-muted"
                data-ocid="browse_lead.back_button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(step) || saveBrowseLead.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="browse_lead.next_button"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isStepValid(4) || saveBrowseLead.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="browse_lead.submit_button"
              >
                {saveBrowseLead.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get my price
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
