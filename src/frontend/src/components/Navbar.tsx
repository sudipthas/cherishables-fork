import LoginModal from "@/components/LoginModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartContext } from "@/context/CartContext";
import { useCartGet } from "@/hooks/useCart";
import { useWebsiteSettings } from "@/hooks/useSettings";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: settings } = useWebsiteSettings();
  const { data: cartData } = useCartGet();
  const { openCart } = useCartContext();
  // Login/account UI removed from header per user request

  const cart = cartData?.cart;
  const items = cart?.items ?? [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity ?? 1),
    0,
  );

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/order-gift", label: "Order a Gift" },
    { to: "/order-3d-model", label: "Order 3D Model" },
    { to: "/order-available-models", label: "Available Models" },
    { to: "/gallery", label: "Gallery" },
    { to: "/reviews", label: "Reviews" },
    { to: "/about", label: "About Us" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b shadow-soft relative">
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-[#d4a017]" />

      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-primary hover:text-accent transition-smooth group"
          data-ocid="nav.home.link"
        >
          <img
            src={settings?.logoUrl || "/assets/logo.png"}
            alt={settings?.siteName || "Cherishables"}
            className="h-12 w-auto md:h-14 object-contain"
          />
          <span
            className="font-display text-xl md:text-2xl font-bold text-[#dc2626] tracking-wide hidden sm:inline"
            style={{ textShadow: "0 1px 2px rgba(212,160,23,0.3)" }}
          >
            {settings?.siteName || "Cherishables"}
          </span>
          <span
            className="font-display text-lg font-bold text-[#dc2626] tracking-wide sm:hidden"
            style={{ textShadow: "0 1px 2px rgba(212,160,23,0.3)" }}
          >
            {settings?.siteName || "Cherishables"}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-foreground hover:text-accent transition-smooth"
              data-ocid={`nav.${link.to.replace(/\//g, "").replace(/-/g, "_")}.link`}
            >
              {link.label}
            </Link>
          ))}

          {/* Cart icon */}
          <button
            type="button"
            onClick={openCart}
            className="relative p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Open cart"
            data-ocid="nav.cart_button"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-md hover:bg-muted transition-smooth"
              aria-label="Open menu"
              data-ocid="nav.mobile_menu.open_button"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-card">
            <div className="flex flex-col gap-6 mt-8">
              <div className="flex items-center gap-2 text-primary">
                <img
                  src={settings?.logoUrl || "/assets/logo.png"}
                  alt={settings?.siteName || "Cherishables"}
                  className="h-10 w-auto object-contain"
                />
                <span
                  className="font-display text-xl font-bold text-[#dc2626] tracking-wide"
                  style={{ textShadow: "0 1px 2px rgba(212,160,23,0.3)" }}
                >
                  {settings?.siteName || "Cherishables"}
                </span>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-foreground hover:text-accent transition-smooth"
                    data-ocid={`nav.mobile.${link.to.replace(/\//g, "").replace(/-/g, "_")}.link`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openCart();
                  }}
                  className="text-base font-medium text-foreground hover:text-accent transition-smooth flex items-center gap-2"
                  data-ocid="nav.mobile.cart_button"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({itemCount})
                </button>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
