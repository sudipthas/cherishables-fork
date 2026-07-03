import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useGetOrdersByCustomer } from "@/hooks/useCustomerOrders";
import { Link } from "@tanstack/react-router";
import {
  Download,
  Loader2,
  LogOut,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  "Out for Delivery": "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Completed: "bg-green-100 text-green-800",
};

export default function AccountPage() {
  const { customer, isLoggedIn, logout } = useCustomerAuth();
  const { data: orders, isLoading } = useGetOrdersByCustomer();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      // login requires backend customer + token; call requestOTP then verifyOTP flow
      // For now, store form data and show OTP input
      setShowLoginForm(false);
      setShowLoginForm(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft text-center">
          <User className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Welcome to Cherishables
          </h1>
          <p className="text-muted-foreground mb-6">
            Log in to view your orders, track deliveries, and download your
            artwork.
          </p>

          {!showLoginForm ? (
            <Button
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
              data-ocid="account.show_login_button"
            >
              Log In / Sign Up
            </Button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="account-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Full Name
                </label>
                <input
                  id="account-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your name"
                  data-ocid="account.name_input"
                />
              </div>
              <div>
                <label
                  htmlFor="account-phone"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="account-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your phone number"
                  data-ocid="account.phone_input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                data-ocid="account.login_submit_button"
              >
                Continue
              </Button>
              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {customer?.name}
              </h1>
              <p className="text-muted-foreground text-sm">{customer?.phone}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="border-border hover:bg-muted"
            data-ocid="account.logout_button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-display font-bold text-foreground">
            Order History
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Link to="/">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-ocid="account.start_shopping_button"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const orderId = order[0];
              const details = order[1];
              const isExpanded = selectedOrder === orderId;

              return (
                <div
                  key={orderId}
                  className="border border-border rounded-xl overflow-hidden"
                  data-ocid={`account.order.${index + 1}`}
                >
                  {/* Order Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(isExpanded ? null : orderId)
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-smooth text-left"
                    data-ocid={`account.order_toggle.${index + 1}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {orderId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(details.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[details.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {details.status}
                      </span>
                      <span className="font-bold text-foreground">
                        ₹
                        {(details.totalAmount
                          ? details.totalAmount / 100
                          : 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </button>

                  {/* Order Details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Order Type
                          </p>
                          <p className="font-medium text-foreground capitalize">
                            {details.orderType || "Standard"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Payment Status
                          </p>
                          <p className="font-medium text-foreground">
                            {details.paymentStatus || "Pending"}
                          </p>
                        </div>
                        {details.trackingId && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Tracking ID
                            </p>
                            <p className="font-medium text-foreground">
                              {details.trackingId}
                            </p>
                          </div>
                        )}
                        {details.estimatedDelivery && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Estimated Delivery
                            </p>
                            <p className="font-medium text-foreground">
                              {new Date(
                                details.estimatedDelivery,
                              ).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Products */}
                      {details.products && details.products.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Items
                          </p>
                          <div className="space-y-2">
                            {details.products.map((product, pidx) => (
                              <div
                                key={product.id || product.name || pidx}
                                className="flex items-center gap-3 bg-background rounded-lg p-2"
                              >
                                {product.imageUrl && (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {product.quantity} × ₹
                                    {(product.price / 100).toLocaleString(
                                      "en-IN",
                                    )}
                                  </p>
                                </div>
                                <p className="font-semibold text-sm">
                                  ₹
                                  {(
                                    (product.price * product.quantity) /
                                    100
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <Link to="/order-status/$orderId" params={{ orderId }}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border hover:bg-muted"
                            data-ocid={`account.track_order_button.${index + 1}`}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Track Order
                          </Button>
                        </Link>

                        {details.artworkUrl &&
                          details.paymentStatus === "Paid" && (
                            <a
                              href={details.artworkUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                data-ocid={`account.download_artwork_button.${index + 1}`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Artwork
                              </Button>
                            </a>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
