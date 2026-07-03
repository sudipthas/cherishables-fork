import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@/hooks/useAdmin";
import { useNavigate } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

const GIFT_MATCHERS = ["merchandise", "prints", "frames", "led", "glass"];

// Match gift categories but exclude "Available Models" so the two listings
// stay separate per the product separation requirement.
function isGiftCategory(category: string): boolean {
  const lower = category.toLowerCase();
  if (lower.includes("available models")) return false;
  return GIFT_MATCHERS.some((m) => lower.includes(m));
}

export default function OrderGiftPage() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useListProducts();

  const gifts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => isGiftCategory(p.category));
  }, [products]);

  return (
    <div className="min-h-screen bg-background">
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
              <Gift className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
                Order a Gift
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Discover personalized merchandise, prints, frames, LED art, and
              glass keepsakes — thoughtful gifts for every occasion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map(() => (
              <div
                key="gift-skeleton"
                className="bg-card border rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-20" data-ocid="gift.empty_state">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              No gift products available right now.
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Check back soon for new arrivals.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/shop" })}
              data-ocid="gift.browse_shop_button"
            >
              Browse All Products
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {gifts.length} gift product
              {gifts.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gifts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <ProductCard
                    product={product}
                    data-ocid={`gift.item.${idx + 1}`}
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
