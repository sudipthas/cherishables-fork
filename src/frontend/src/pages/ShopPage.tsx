import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListProducts } from "@/hooks/useAdmin";
import { useCartAdd } from "@/hooks/useCart";
import { Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Miniatures", value: "Miniatures" },
  { label: "Corporate Gifts", value: "Corporate Gifts" },
  { label: "Ready to Ship", value: "Ready to Ship" },
  { label: "Custom Figurines", value: "Custom Figurines" },
  { label: "Photo Gifts", value: "Photo Gifts" },
];

export default function ShopPage() {
  const { data: products, isLoading } = useListProducts();
  const addToCart = useCartAdd();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || p.category === category;
      const matchesPrice =
        Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, search, category, priceRange]);

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
              Shop All Products
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse our full collection of custom miniatures, personalized
              gifts, and handcrafted treasures.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="container mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-ocid="shop.search_input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((s) => !s)}
            className="md:w-auto"
            data-ocid="shop.filter_toggle"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border rounded-xl p-6 mb-8"
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <Button
                  key={c.value}
                  variant={category === c.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(c.value)}
                  data-ocid={`shop.category.${c.value}.button`}
                >
                  {c.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Price:</span>
              <Input
                type="number"
                placeholder="Min"
                value={priceRange[0] || ""}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="w-24"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceRange[1] || ""}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="w-24"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("all");
                  setPriceRange([0, 50000]);
                }}
              >
                Reset
              </Button>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`shop-skeleton-${i}-${Math.random()}`}
                className="bg-card border rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-ocid="shop.empty_state">
            <p className="text-muted-foreground text-lg mb-4">
              No products match your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setPriceRange([0, 50000]);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filtered.length} product
              {filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    data-ocid={`shop.item.${idx + 1}`}
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
