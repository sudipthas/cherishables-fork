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
import { useSaveCartLead } from "@/hooks/useAdmin";
import { Loader2, Mail, Phone, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CartLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onSubmitSuccess: () => void;
}

export function CartLeadModal({
  open,
  onOpenChange,
  productName,
  onSubmitSuccess,
}: CartLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const saveCartLead = useSaveCartLead();

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-+()]{7,20}$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await saveCartLead.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        productName,
      });

      toast.success("Details saved! Item added to cart.");
      setName("");
      setPhone("");
      setEmail("");
      setErrors({});
      onOpenChange(false);
      onSubmitSuccess();
    } catch {
      toast.error("Failed to save details. Please try again.");
    }
  };

  const handleClose = () => {
    if (saveCartLead.isPending) return;
    setName("");
    setPhone("");
    setEmail("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-card border-border"
        data-ocid="cart_lead.modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Add to Cart
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please share your contact details so we can assist you with{" "}
            <span className="font-semibold text-foreground">{productName}</span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cart-lead-name" className="text-foreground">
              Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cart-lead-name"
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
                data-ocid="cart_lead.name_input"
              />
            </div>
            {errors.name && (
              <p
                className="text-sm text-destructive"
                data-ocid="cart_lead.name_error"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cart-lead-phone" className="text-foreground">
              Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cart-lead-phone"
                type="tel"
                placeholder="Your phone number"
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
                data-ocid="cart_lead.phone_input"
              />
            </div>
            {errors.phone && (
              <p
                className="text-sm text-destructive"
                data-ocid="cart_lead.phone_error"
              >
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cart-lead-email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cart-lead-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground ${
                  errors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                data-ocid="cart_lead.email_input"
              />
            </div>
            {errors.email && (
              <p
                className="text-sm text-destructive"
                data-ocid="cart_lead.email_error"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
              onClick={handleClose}
              disabled={saveCartLead.isPending}
              data-ocid="cart_lead.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saveCartLead.isPending}
              data-ocid="cart_lead.submit_button"
            >
              {saveCartLead.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
