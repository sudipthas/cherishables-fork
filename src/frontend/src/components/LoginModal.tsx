import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useActor } from "@caffeineai/core-infrastructure";
import { ArrowLeft, Loader2, Phone } from "lucide-react";
import { useState } from "react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login } = useCustomerAuth();
  const { actor } = useActor(createActor);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError("");
    if (!phone || !name) {
      setError("Please fill in all fields");
      return;
    }
    setIsSending(true);
    try {
      if (!actor) throw new Error("Backend not available");
      const res = await actor.requestOTP({ phone });
      if (!res.success) {
        console.error("requestOTP failed:", res.message);
        throw new Error(res.message || "Failed to send OTP");
      }
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setIsVerifying(true);
    try {
      if (!actor) throw new Error("Backend not available");
      const res = await actor.verifyOTP({ otp, name, phone, email: "" });
      if (!res.success) {
        console.error("verifyOTP failed:", res.message);
        throw new Error(res.message || "Invalid OTP");
      }
      if (!res.token || !res.customer)
        throw new Error("Login failed: no token received");
      localStorage.setItem("cherishables_customer_token", res.token);
      window.dispatchEvent(
        new StorageEvent("storage", { key: "cherishables_customer_token" }),
      );
      login(res.customer, res.token);
      onOpenChange(false);
      setStep("phone");
      setOtp("");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("phone");
    setError("");
    setOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            {step === "otp" && (
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="p-1 rounded-md hover:bg-muted transition-smooth"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {step === "phone" ? "Log In to Cherishables" : "Enter OTP"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === "phone"
              ? "Enter your details to receive a one-time password"
              : `We sent a 6-digit code to ${phone}`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <div className="space-y-4 pt-2">
            <div>
              <label
                htmlFor="login-name"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Full Name
              </label>
              <Input
                id="login-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="login-phone"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="login.error_message"
              >
                {error}
              </p>
            )}

            <Button
              onClick={handleSendOtp}
              disabled={isSending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              data-ocid="login.send_otp_button"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                data-ocid="login.otp_input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p
                className="text-sm text-destructive text-center"
                data-ocid="login.error_message"
              >
                {error}
              </p>
            )}

            <Button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              data-ocid="login.verify_otp_button"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Log In"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSending}
                className="text-primary hover:underline font-medium"
                data-ocid="login.resend_otp_button"
              >
                Resend OTP
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
