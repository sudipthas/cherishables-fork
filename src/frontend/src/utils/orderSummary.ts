/**
 * Order summary utilities — clean display helpers for customer details.
 *
 * Price contract (bidirectional):
 * - Backend stores and returns prices in paise (×100).
 * - Frontend display helpers divide by 100 to show rupees.
 * - Frontend must multiply by 100 when sending prices to the backend.
 */

import { formatPaise } from "@/lib/utils";

export interface ParsedAddOn {
  name: string;
  priceRange: string;
  category: string;
}

export interface ParsedAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

/**
 * Parse the selectedAddOns JSON string stored on the Order.
 * Returns an empty array if the string is missing or malformed.
 */
export function parseSelectedAddOns(raw?: string): ParsedAddOn[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ParsedAddOn[];
  } catch {
    // malformed — return empty
  }
  return [];
}

/**
 * Parse the deliveryAddress from an Order.
 * The backend stores it as a structured DeliveryAddress object.
 * This helper just re-exports it with the local ParsedAddress type.
 */
export function parseDeliveryAddress(
  addr:
    | {
        fullName?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
      }
    | undefined,
): ParsedAddress | null {
  if (!addr?.addressLine1) return null;
  return addr;
}

/**
 * Build a single human-readable address line.
 */
export function formatAddressLine(addr: ParsedAddress): string {
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}
