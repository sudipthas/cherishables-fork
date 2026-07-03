import type { AddonProduct } from "@/backend";
import { CartLeadModal } from "@/components/CartLeadModal";
import { Button } from "@/components/ui/button";
import { BROWSE_LEAD_STORAGE_KEY } from "@/types";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: AddonProduct;
  onAddToCart?: (product: {
    id: string;
    name: string;
    price: bigint;
    image: string;
  }) => void;
  onBuyNow?: (product: {
    id: string;
    name: string;
    price: bigint;
    image: string;
  }) => void;
  "data-ocid"?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
  "data-ocid": ocid,
}: ProductCardProps) {
  const priceInRupees = Number(product.price) / 100;
  const [modalOpen, setModalOpen] = useState(false);

  const handleAddToCartClick = () => {
    // If a Browse Lead was already captured (Available Models / 3D Model
    // flows), skip the CartLeadModal and add the item to the cart directly
    // without re-prompting for name, phone, or email. If no Browse Lead was
    // captured (e.g. direct navigation to a product), the existing
    // CartLeadModal behavior remains unchanged.
    try {
      const stored = localStorage.getItem(BROWSE_LEAD_STORAGE_KEY);
      if (stored) {
        handleModalSuccess();
        return;
      }
    } catch {
      // localStorage unavailable — fall through to the modal flow
    }
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.imageUrl ?? "",
      });
    }
  };

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.imageUrl ?? "",
      });
    }
  };

  return (
    <>
      <div
        className="bg-card border rounded-xl overflow-hidden product-card-hover flex flex-col h-full"
        data-ocid={ocid}
      >
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="block relative aspect-square overflow-hidden bg-muted"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
        </Link>
        <div className="p-4 flex flex-col flex-1">
          <Link to="/product/$id" params={{ id: product.id }} className="block">
            <h3 className="font-display font-semibold text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="font-bold text-primary">
              ₹
              {priceInRupees.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
            <div className="flex gap-2">
              {onBuyNow && (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleBuyNowClick}
                  data-ocid={`${ocid}.buy_now_button`}
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                  Buy
                </Button>
              )}
              {onAddToCart && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddToCartClick}
                  data-ocid={`${ocid}.add_button`}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CartLeadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        productName={product.name}
        onSubmitSuccess={handleModalSuccess}
      />
    </>
  );
}
