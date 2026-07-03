import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@/hooks/useAdmin";
import { useCartAdd } from "@/hooks/useCart";
import { Building2, Gift, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

export default function CorporateGiftsPage() {
  const { data: products, isLoading } = useListProducts();
  const addToCart = useCartAdd();

  const corporate = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.category === "Corporate Gifts" ||
        p.name.toLowerCase().includes("corporate") ||
        p.name.toLowerCase().includes("bulk"),
    );
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
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Corporate & Bulk Gifts
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Meaningful personalized gifts for employees, clients, and events.
              Volume pricing and custom branding available.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Corporate */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Employee Recognition",
                desc: "Celebrate milestones, anniversaries, and achievements with personalized miniatures.",
              },
              {
                icon: Gift,
                title: "Client Appreciation",
                desc: "Stand out with thoughtful, handcrafted gifts that leave a lasting impression.",
              },
              {
                icon: Mail,
                title: "Event Giveaways",
                desc: "Custom-branded miniatures for conferences, product launches, and celebrations.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border rounded-xl p-6"
              >
                <item.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="font-display text-2xl font-bold mb-6">
          Corporate Gift Collection
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`corp-skeleton-${i}-${Math.random()}`}
                className="bg-card border rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : corporate.length === 0 ? (
          <div className="text-center py-20" data-ocid="corporate.empty_state">
            <p className="text-muted-foreground text-lg mb-4">
              No corporate gifts listed yet. Contact us for custom orders.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Us
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Us
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {corporate.map((product, idx) => (
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
                  data-ocid={`corporate.item.${idx + 1}`}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
