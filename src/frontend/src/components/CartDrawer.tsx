import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartContext } from "@/context/CartContext";
import {
  computeCartTotal,
  useCartClear,
  useCartGet,
  useCartRemove,
  useCartUpdateQuantity,
} from "@/hooks/useCart";
import { formatPaise, formatPrice } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";

export function CartDrawer() {
  const { isCartOpen, closeCart } = useCartContext();
  const { data: cartData, isLoading } = useCartGet();
  const removeMutation = useCartRemove();
  const updateMutation = useCartUpdateQuantity();
  const clearMutation = useCartClear();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const cart = cartData?.cart;
  const items = cart?.items ?? [];
  const total = computeCartTotal(items);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    removeMutation.mutate(productId, {
      onSettled: () => setRemovingId(null),
    });
  };

  const handleQuantityChange = (
    productId: string,
    delta: number,
    currentQty: number,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
    updateMutation.mutate({ productId, quantity: newQty });
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        className="w-full sm:max-w-md bg-card border-l border-border flex flex-col"
        data-ocid="cart.drawer"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4"
            data-ocid="cart.empty_state"
          >
            <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium text-foreground">
                Your cart is empty
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some keepsakes to get started
              </p>
            </div>
            <Button
              onClick={closeCart}
              variant="outline"
              className="mt-2"
              data-ocid="cart.continue_shopping_button"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className={`flex gap-3 p-3 rounded-lg bg-muted/30 border border-border transition-all ${
                    removingId === item.productId ? "opacity-50" : ""
                  }`}
                  data-ocid={`cart.item.${item.productId}`}
                >
                  <div className="h-20 w-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.flowType}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              -1,
                              Number(item.quantity),
                            )
                          }
                          disabled={updateMutation.isPending}
                          data-ocid={`cart.decrease_qty.${item.productId}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity ?? 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              1,
                              Number(item.quantity),
                            )
                          }
                          disabled={updateMutation.isPending}
                          data-ocid={`cart.increase_qty.${item.productId}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {formatPaise(
                          Number(item.price) * Number(item.quantity),
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => handleRemove(item.productId)}
                    disabled={removeMutation.isPending}
                    data-ocid={`cart.remove_button.${item.productId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  data-ocid="cart.clear_button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                  data-ocid="cart.checkout_button"
                >
                  <Link to="/cart" onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
