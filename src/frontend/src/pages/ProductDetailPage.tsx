import { createActor } from "@/backend";
import { CartLeadModal } from "@/components/CartLeadModal";
import { useCartContext } from "@/context/CartContext";
import { useCartAdd } from "@/hooks/useCart";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

export default function ProductDetailPage() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartLeadModalOpen, setCartLeadModalOpen] = useState(false);

  const { actor } = useActor(createActor);
  const addToCart = useCartAdd();
  const { setBuyNowItem } = useCartContext();

  const { data: productOpt, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!actor) return null;
      return await actor.getProduct(id);
    },
    enabled: !!actor,
  });

  const product = productOpt || null;

  // Build image URLs array from product data
  // Backend AddonProduct has imageUrl; imageUrls may be added in future
  const imageUrls: string[] =
    product && (product as unknown as { imageUrls?: string[] }).imageUrls
      ? (product as unknown as { imageUrls: string[] }).imageUrls
      : product?.imageUrl
        ? [product.imageUrl]
        : [];

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback to document.execCommand
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product?.name || "Product", url });
    } else {
      const success = await copyToClipboard(url);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Available Models takes precedence over 3D and standard flows so these
  // ready-to-ship products skip the image upload step at checkout.
  const categoryLower = product?.category?.toLowerCase() ?? "";
  const flowType = categoryLower.includes("available models")
    ? "available_models"
    : categoryLower.includes("3d")
      ? "3d_model"
      : "standard";

  const handleAddToCart = () => {
    if (!product) return;
    setCartLeadModalOpen(true);
  };

  const handleCartLeadSuccess = () => {
    if (!product) return;
    addToCart.mutate(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: BigInt(1),
        image: product.imageUrl ?? "",
        flowType,
        itemImages: [],
      },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => {
            setAdded(false);
            navigate({ to: "/cart" });
          }, 800);
        },
      },
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    setBuyNowItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.imageUrl ?? "",
      flowType,
    });
    navigate({ to: "/checkout", search: { mode: "buynow" } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-lg">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-lg">Product not found</div>
      </div>
    );
  }

  const priceInRupees = Number(product.price) / 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-primary hover:text-accent mb-6 transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
          {/* Main Image Viewer */}
          <div className="aspect-square md:aspect-video bg-muted relative group">
            {imageUrls.length > 0 ? (
              <>
                <img
                  src={imageUrls[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev > 0 ? prev - 1 : imageUrls.length - 1,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/90 border border-border flex items-center justify-center text-foreground hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous image"
                      data-ocid="product.gallery.prev_button"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev < imageUrls.length - 1 ? prev + 1 : 0,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/90 border border-border flex items-center justify-center text-foreground hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next image"
                      data-ocid="product.gallery.next_button"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imageUrls.map((_, idx) => (
                        <button
                          key={`product-dot-${product.id}-${idx}`}
                          type="button"
                          onClick={() => setSelectedImage(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === selectedImage
                              ? "w-6 bg-primary"
                              : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                          data-ocid={`product.gallery.dot.${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {imageUrls.length > 1 && (
            <div className="px-4 py-3 border-t border-border bg-card">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imageUrls.map((url, idx) => (
                  <button
                    key={`product-thumb-${product.id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-smooth ${
                      idx === selectedImage
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-border"
                    }`}
                    data-ocid={`product.gallery.thumbnail.${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} - view ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-smooth"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>

            <p className="text-2xl font-bold text-primary mb-4">
              ₹{priceInRupees.toFixed(2)}
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              {product.description || "No description available."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-ocid="product.buy_now_button"
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-smooth"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now
              </button>
              <button
                type="button"
                data-ocid="product.add_to_cart_button"
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-4 rounded-xl font-semibold text-lg hover:bg-secondary/80 transition-smooth disabled:opacity-60"
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CartLeadModal
        open={cartLeadModalOpen}
        onOpenChange={setCartLeadModalOpen}
        productName={product.name}
        onSubmitSuccess={handleCartLeadSuccess}
      />
    </div>
  );
}
