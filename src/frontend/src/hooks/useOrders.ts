// DEPRECATED: All order and Razorpay checkout logic has been consolidated into useOrder.ts.
// This file is kept to prevent import errors but should not be used.
// Use useOrder() from "@/hooks/useOrder" instead.

import { toast } from "sonner";

export interface ItemImageSlot {
  file: File | null;
  preview: string | null;
  uploadedUrl?: string;
}

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface CreateCheckoutOrderParams {
  items: Array<{
    name: string;
    productId: string;
    flowType: string;
    quantity: bigint;
    image: string;
    price: bigint;
    itemImages: Array<string>;
  }>;
  formData: CheckoutFormData;
  itemImages: Record<string, ItemImageSlot[]>;
  subtotal: number;
}

export function useOrders() {
  const msg =
    "useOrders is deprecated. Please use useOrder() from @/hooks/useOrder instead.";
  toast.error(msg);
  throw new Error(msg);
}
