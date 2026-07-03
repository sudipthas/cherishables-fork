import type { BuyNowItem } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface CartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  buyNowItem: BuyNowItem | null;
  setBuyNowItem: (item: BuyNowItem | null) => void;
  clearBuyNowItem: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyNowItem, setBuyNowItemState] = useState<BuyNowItem | null>(() => {
    try {
      const saved = localStorage.getItem("buynow_item");
      if (saved) {
        const parsed = JSON.parse(saved) as BuyNowItem;
        if (parsed?.productId && parsed.name && parsed.flowType) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  });

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);
  const setBuyNowItem = useCallback((item: BuyNowItem | null) => {
    setBuyNowItemState(item);
    if (item) {
      localStorage.setItem("buynow_item", JSON.stringify(item));
    } else {
      localStorage.removeItem("buynow_item");
    }
  }, []);
  const clearBuyNowItem = useCallback(() => {
    setBuyNowItemState(null);
    localStorage.removeItem("buynow_item");
  }, []);

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        buyNowItem,
        setBuyNowItem,
        clearBuyNowItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
