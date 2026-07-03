import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetOrder } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Package, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: order, isLoading } = useGetOrder(orderId);

  const handleSearch = () => {
    if (orderId.trim()) {
      setSearched(true);
    }
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
              <Package className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
                Track Your Order
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Enter your order ID to see the current status and estimated
              delivery date.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="container mx-auto px-4 py-12 max-w-xl">
        <div className="bg-card border rounded-xl p-6 shadow-soft">
          <label
            htmlFor="track-order-id"
            className="block text-sm font-medium mb-2"
          >
            Order ID
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="track-order-id"
                placeholder="e.g. ORD-123456"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
                data-ocid="track.search_input"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!orderId.trim() || isLoading}
              data-ocid="track.search_button"
            >
              {isLoading ? "Searching..." : "Track"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {searched && !isLoading && !order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
            data-ocid="track.empty_state"
          >
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              Order not found
            </p>
            <p className="text-sm text-muted-foreground">
              Double-check your order ID or contact support.
            </p>
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-6 mt-6 shadow-soft"
            data-ocid="track.result.card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-display text-lg font-semibold">
                  {order.orderId}
                </p>
              </div>
              <Link
                to={`/order-status/${order.orderId}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
                data-ocid="track.view_details_link"
              >
                View Details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{order.orderStatus}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  ₹{(Number(order.amount) / 100).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordered On</p>
                <p className="font-medium">
                  {new Date(Number(order.createdAt)).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
