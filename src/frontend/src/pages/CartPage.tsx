import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  computeCartTotal,
  useCartClear,
  useCartGet,
  useCartRemove,
  useCartUpdateQuantity,
} from "@/hooks/useCart";
import { formatPaise, formatPrice } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { data: cartData, isLoading } = useCartGet();
  const removeMutation = useCartRemove();
  const updateMutation = useCartUpdateQuantity();
  const clearMutation = useCartClear();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4"
        data-ocid="cart.page.empty_state"
      >
        <ShoppingBag className="h-20 w-20 text-muted-foreground/30" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mt-2">
            Add some keepsakes to get started
          </p>
        </div>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          data-ocid="cart.page.continue_shopping"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          Shopping Cart ({itemCount})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card
              key={item.productId}
              className={`transition-all ${removingId === item.productId ? "opacity-50" : ""}`}
              data-ocid={`cart.page.item.${item.productId}`}
            >
              <CardContent className="p-4 flex gap-4">
                <div className="h-24 w-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.flowType}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(item.productId)}
                      disabled={removeMutation.isPending}
                      data-ocid={`cart.page.remove_button.${item.productId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            -1,
                            Number(item.quantity),
                          )
                        }
                        disabled={updateMutation.isPending}
                        data-ocid={`cart.page.decrease_qty.${item.productId}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity ?? 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            1,
                            Number(item.quantity),
                          )
                        }
                        disabled={updateMutation.isPending}
                        data-ocid={`cart.page.increase_qty.${item.productId}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatPaise(Number(item.price) * Number(item.quantity))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="w-full"
            data-ocid="cart.page.clear_button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Order Summary
              </h2>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Items ({itemCount})
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
                data-ocid="cart.page.checkout_button"
                onClick={() =>
                  navigate({ to: "/checkout", search: { mode: "cart" } })
                }
                disabled={items.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                asChild
                data-ocid="cart.page.continue_shopping"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
