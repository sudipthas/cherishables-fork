import { BrowseLeadModal } from "@/components/BrowseLeadModal";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { useListProducts } from "@/hooks/useAdmin";
import { useCartAdd } from "@/hooks/useCart";
import { AVAILABLE_MODELS_CATEGORY } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function isAvailableModelsCategory(category: string): boolean {
  return category
    .toLowerCase()
    .includes(AVAILABLE_MODELS_CATEGORY.toLowerCase());
}

export default function OrderAvailableModelsPage() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useListProducts();
  const addToCart = useCartAdd();
  const { setBuyNowItem } = useCartContext();
  // Browse Lead modal shows on every page entry — no skip for returning
  // customers. It blocks product browsing until the customer submits name
  // and phone.
  const [browseLeadOpen, setBrowseLeadOpen] = useState(true);

  const models = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => isAvailableModelsCategory(p.category));
  }, [products]);

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: bigint;
    image: string;
  }) => {
    addToCart.mutate(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: BigInt(1),
        image: product.image,
        flowType: "available_models",
        itemImages: [],
      },
      {
        onSuccess: () => {
          toast.success(`${product.name} added to cart`);
        },
      },
    );
  };

  const handleBuyNow = (product: {
    id: string;
    name: string;
    price: bigint;
    image: string;
  }) => {
    setBuyNowItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
      flowType: "available_models",
    });
    navigate({ to: "/checkout", search: { mode: "buynow" } });
  };

  return (
    <div className="min-h-screen bg-background">
      <BrowseLeadModal
        open={browseLeadOpen}
        onClose={() => setBrowseLeadOpen(false)}
        flowType="available_models"
      />
      {/* Hero */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
                Available Models
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse our curated collection of ready-to-order models. Pick a
              favorite, check out in minutes, and we'll ship it straight to your
              door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              "am-skeleton-1",
              "am-skeleton-2",
              "am-skeleton-3",
              "am-skeleton-4",
              "am-skeleton-5",
              "am-skeleton-6",
              "am-skeleton-7",
              "am-skeleton-8",
            ].map((key) => (
              <div
                key={key}
                className="bg-card border rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : models.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="available_models.empty_state"
          >
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              No available models listed right now.
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Check back soon for new ready-to-ship creations.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/shop" })}
              data-ocid="available_models.browse_shop_button"
            >
              Browse All Products
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {models.length} available model
              {models.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {models.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    data-ocid={`available_models.item.${idx + 1}`}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
