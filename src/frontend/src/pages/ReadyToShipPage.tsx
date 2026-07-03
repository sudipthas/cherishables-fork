import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@/hooks/useAdmin";
import { useCartAdd } from "@/hooks/useCart";
import { Truck } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

export default function ReadyToShipPage() {
  const { data: products, isLoading } = useListProducts();
  const addToCart = useCartAdd();

  const ready = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.category === "Ready to Ship");
  }, [products]);

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: bigint;
    image: string;
  }) => {
    addToCart.mutate({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: BigInt(1),
      flowType: "standard",
      image: product.image,
      itemImages: [],
    });
  };

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
              <Truck className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
                Ready to Ship
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Skip the wait. These handcrafted items are already made and ready
              to be packed and shipped within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`ready-skeleton-${i}-${Math.random()}`}
                className="bg-card border rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : ready.length === 0 ? (
          <div className="text-center py-20" data-ocid="ready.empty_state">
            <p className="text-muted-foreground text-lg mb-4">
              No ready-to-ship items available right now.
            </p>
            <Button variant="outline">Browse All Products</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {ready.length} item{ready.length !== 1 ? "s" : ""} ready to ship
              within 24 hours
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ready.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    data-ocid={`ready.item.${idx + 1}`}
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
