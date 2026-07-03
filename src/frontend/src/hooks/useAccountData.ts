import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCallback, useEffect, useState } from "react";

export interface SavedAddress {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  addedAt: number;
}

const ADDRESSES_KEY = "cherishables_addresses";
const WISHLIST_KEY = "cherishables_wishlist";

function loadAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedAddress[];
  } catch {
    return [];
  }
}

function saveAddresses(addresses: SavedAddress[]) {
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
}

function loadWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WishlistItem[];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function useSavedAddresses() {
  const { customer } = useCustomerAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>(loadAddresses);
  // Reference customer to avoid unused variable lint error while keeping hook signature
  void customer;

  useEffect(() => {
    setAddresses(loadAddresses());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAddress = useCallback((addr: Omit<SavedAddress, "id">) => {
    const newAddr: SavedAddress = {
      ...addr,
      id: `addr_${Date.now()}`,
    };
    setAddresses((prev) => {
      const updated = addr.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
        : prev.concat(newAddr);
      saveAddresses(updated);
      return updated;
    });
  }, []);

  const updateAddress = useCallback(
    (id: string, updates: Partial<SavedAddress>) => {
      setAddresses((prev) => {
        const updated = prev.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...updates };
          return next;
        });
        if (updates.isDefault) {
          const final = updated.map((a) =>
            a.id === id
              ? { ...a, isDefault: true }
              : { ...a, isDefault: false },
          );
          saveAddresses(final);
          return final;
        }
        saveAddresses(updated);
        return updated;
      });
    },
    [],
  );

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveAddresses(updated);
      return updated;
    });
  }, []);

  return { addresses, addAddress, updateAddress, deleteAddress };
}

export function useWishlist() {
  const { customer } = useCustomerAuth();
  const [items, setItems] = useState<WishlistItem[]>(loadWishlist);
  // Reference customer to avoid unused variable lint error while keeping hook signature
  void customer;

  useEffect(() => {
    setItems(loadWishlist());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = useCallback((item: Omit<WishlistItem, "id" | "addedAt">) => {
    setItems((prev) => {
      if (prev.some((i) => i.name === item.name)) return prev;
      const newItem: WishlistItem = {
        ...item,
        id: `wish_${Date.now()}`,
        addedAt: Date.now(),
      };
      const updated = [newItem, ...prev];
      saveWishlist(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveWishlist(updated);
      return updated;
    });
  }, []);

  const isInWishlist = useCallback(
    (name: string) => items.some((i) => i.name === name),
    [items],
  );

  return { items, addItem, removeItem, isInWishlist };
}
