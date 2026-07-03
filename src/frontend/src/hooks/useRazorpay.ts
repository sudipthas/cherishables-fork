// DEPRECATED: All Razorpay checkout logic has been consolidated into useOrder.ts.
// This file is kept for reference but should not be used.
// Use useOrder() from "@/hooks/useOrder" instead.

import { toast } from "sonner";

export function useRazorpay() {
  // Return a stub that shows a clear error if accidentally used
  return {
    openRazorpayCheckout: async () => {
      const msg =
        "useRazorpay is deprecated. Please use useOrder().openRazorpayCheckout() instead.";
      toast.error(msg);
      throw new Error(msg);
    },
    isLoading: false,
    error: null,
  };
}
