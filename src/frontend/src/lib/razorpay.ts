// DEPRECATED: All Razorpay checkout logic has been consolidated into useOrder.ts.
// This file is kept for reference but should not be imported.
// Use useOrder() from "@/hooks/useOrder" instead.

import { toast } from "sonner";

export interface RazorpayOrderDetails {
  orderId: string;
  currency: string;
  amount: bigint;
  keyId: string;
}

export function loadRazorpayScript(): Promise<void> {
  const msg =
    "lib/razorpay.ts is deprecated. Use useOrder().loadRazorpayScript() instead.";
  toast.error(msg);
  return Promise.reject(new Error(msg));
}

export async function openRazorpayCheckout(): Promise<void> {
  const msg =
    "lib/razorpay.ts is deprecated. Use useOrder().openRazorpayCheckout() instead.";
  toast.error(msg);
  throw new Error(msg);
}
