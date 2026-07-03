import { MessageDirection, OrderStatus, PaymentMode } from "@/backend";
import type { PaymentStatus } from "@/backend";
import WatermarkedImage from "@/components/WatermarkedImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useArtworkDownload } from "@/context/ArtworkDownloadContext";
import {
  useAddCustomerReplyPublic,
  useDeleteCommunicationMessage,
  useGetPublicCommunicationLogs,
  useIsCallerAdmin,
} from "@/hooks/useAdmin";
import { useOrder } from "@/hooks/useOrder";
import { useGetOrder } from "@/hooks/useQueries";
import {
  parseDeliveryAddress,
  parseSelectedAddOns,
} from "@/utils/orderSummary";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Heart,
  Inbox,
  Lock,
  MessageCircle,
  Package,
  Paintbrush,
  Printer,
  Send,
  Trash2,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const stages = [
  { label: "Order Placed", icon: Inbox, description: "Order confirmed" },
  {
    label: "Photos Received",
    icon: CheckCircle2,
    description: "Customer photos uploaded",
  },
  {
    label: "Design In Progress",
    icon: Paintbrush,
    description: "Artist is creating your artwork",
  },
  {
    label: "Preview Sent",
    icon: Eye,
    description: "Design preview sent for approval",
  },
  {
    label: "Approved",
    icon: CheckCircle2,
    description: "Design approved by customer",
  },
  { label: "Printing", icon: Printer, description: "3D printing in progress" },
  {
    label: "Painting",
    icon: Paintbrush,
    description: "Hand-painting your miniature",
  },
  {
    label: "Packaging",
    icon: Package,
    description: "Carefully packed for shipping",
  },
  { label: "Shipped", icon: Truck, description: "On the way to you" },
  { label: "Delivered", icon: Download, description: "Delivered successfully" },
];

// Map backend OrderStatus (6 values) to 10-step visual pipeline
const statusToIndex: Record<OrderStatus, number> = {
  [OrderStatus.Received]: 0,
  [OrderStatus.InProgress]: 2,
  [OrderStatus.Shipped]: 8,
  [OrderStatus.OutForDelivery]: 8,
  [OrderStatus.Completed]: 9,
  [OrderStatus.Delivered]: 9,
};

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPaymentStatusVariant(
  status: PaymentStatus,
): "default" | "secondary" | "destructive" | "outline" {
  const resolved = resolvePaymentStatus(status);
  switch (resolved) {
    case "Paid":
      return "default";
    case "AdvancePaid":
      return "secondary";
    case "Pending":
      return "secondary";
    case "Failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getPaymentStatusLabel(status: PaymentStatus): string {
  const resolved = resolvePaymentStatus(status);
  switch (resolved) {
    case "Paid":
      return "✓ Paid";
    case "AdvancePaid":
      return "✓ Advance Paid";
    case "Pending":
      return "Pending";
    case "Failed":
      return "Failed";
    default:
      return String(status);
  }
}

function getPortraitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    Single: "Single Portrait",
    Couple: "Couple Portrait",
    Family: "Family Portrait",
    Group: "Group Portrait",
  };
  return labels[type] || type;
}

function getArtStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    CuteCartoon: "Cute Cartoon",
    ProfessionalPortrait: "Professional Portrait",
    SoftAesthetic: "Soft Aesthetic",
    FunnyExaggerated: "Funny Exaggerated",
    CoupleIllustration: "Couple Illustration",
    Chibi: "Chibi Style",
  };
  return labels[style] || style;
}

// Strip HTML tags and decode entities for human-readable message text
function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Resolve payment status from both string and Candid variant { Paid: null } formats
function resolvePaymentStatus(
  status: PaymentStatus,
): "Paid" | "AdvancePaid" | "Pending" | "Failed" | "Unknown" {
  if (typeof status === "string") {
    if (status === "Paid") return "Paid";
    if (status === "AdvancePaid") return "AdvancePaid";
    if (status === "Pending") return "Pending";
    if (status === "Failed") return "Failed";
  }
  if (typeof status === "object" && status !== null) {
    if ("Paid" in status) return "Paid";
    if ("AdvancePaid" in status) return "AdvancePaid";
    if ("Pending" in status) return "Pending";
    if ("Failed" in status) return "Failed";
  }
  return "Unknown";
}

export default function OrderStatusPage() {
  const { orderId } = useParams({ from: "/order-status/$orderId" });
  // `paid=1` search param set by useOrder on successful Razorpay payment
  // so we can show confirmation banner immediately without waiting for backend poll
  const search = useSearch({ strict: false }) as Record<string, string>;
  const justPaid = search?.paid === "1";

  const { data: order, isLoading, error, refetch } = useGetOrder(orderId);
  const { openRazorpayCheckout, loadRazorpayScript, razorpayLoading, actor } =
    useOrder();
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [payNowError, setPayNowError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setArtworkDownload, clearArtworkDownload } = useArtworkDownload();

  const { data: commLogs, isLoading: commLoading } =
    useGetPublicCommunicationLogs(orderId);
  const addReply = useAddCustomerReplyPublic();
  const deleteMessage = useDeleteCommunicationMessage();
  const { data: isAdmin } = useIsCallerAdmin();
  const [replyMessage, setReplyMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [replyStatus, setReplyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    logId: string;
    messageIndex: number;
  } | null>(null);

  // Pre-fill reply email from order data
  useEffect(() => {
    if (order?.customerEmail) {
      setReplyEmail(order.customerEmail);
    }
  }, [order?.customerEmail]);

  const handlePayNow = useCallback(async () => {
    if (!order) return;
    setPayNowLoading(true);
    setPayNowError(null);
    try {
      await loadRazorpayScript();

      // Fetch checkout payload from backend using the actor from useOrder hook
      if (!actor) {
        throw new Error(
          "Backend connection not available. Please refresh and try again.",
        );
      }
      const payloadResult = await actor.getRazorpayCheckoutPayload(
        order.orderId,
      );
      if (payloadResult.__kind__ === "err") {
        throw new Error(payloadResult.err || "Failed to load payment details.");
      }
      console.log(
        "[OrderStatusPage] getRazorpayCheckoutPayload result:",
        payloadResult,
      );

      let payload: {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
      };
      try {
        payload = JSON.parse(payloadResult.ok) as {
          keyId: string;
          orderId: string;
          amount: number;
          currency: string;
        };
      } catch (parseErr) {
        console.error(
          "[OrderStatusPage] JSON parse error:",
          parseErr,
          "raw:",
          payloadResult.ok,
        );
        throw new Error("Failed to parse payment details. Please try again.");
      }

      console.log("[OrderStatusPage] parsed payload:", payload);

      await openRazorpayCheckout(
        {
          keyId: payload.keyId,
          orderId: payload.orderId,
          amount: BigInt(payload.amount),
          currency: payload.currency,
        },
        order.customerName,
        order.customerEmail,
        `Payment for order ${order.orderId}`,
        order.orderId,
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Payment setup failed. Please try again.";
      console.error("[OrderStatusPage] handlePayNow error:", err);
      setPayNowError(msg);
    } finally {
      setPayNowLoading(false);
    }
  }, [order, loadRazorpayScript, openRazorpayCheckout, actor]);

  const handlePayRemainingBalance = useCallback(async () => {
    if (!order) return;
    setPayNowLoading(true);
    setPayNowError(null);
    try {
      await loadRazorpayScript();

      if (!actor) {
        throw new Error(
          "Backend connection not available. Please refresh and try again.",
        );
      }
      const payloadResult = await actor.getRazorpayCheckoutPayload(
        order.orderId,
      );
      if (payloadResult.__kind__ === "err") {
        throw new Error(payloadResult.err || "Failed to load payment details.");
      }

      let payload: {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
      };
      try {
        payload = JSON.parse(payloadResult.ok) as {
          keyId: string;
          orderId: string;
          amount: number;
          currency: string;
        };
      } catch (parseErr) {
        console.error(
          "[OrderStatusPage] JSON parse error:",
          parseErr,
          "raw:",
          payloadResult.ok,
        );
        throw new Error("Failed to parse payment details. Please try again.");
      }

      await openRazorpayCheckout(
        {
          keyId: payload.keyId,
          orderId: payload.orderId,
          amount: BigInt(payload.amount),
          currency: payload.currency,
        },
        order.customerName,
        order.customerEmail,
        `Remaining balance for order ${order.orderId}`,
        order.orderId,
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Payment setup failed. Please try again.";
      console.error("[OrderStatusPage] handlePayRemainingBalance error:", err);
      setPayNowError(msg);
    } finally {
      setPayNowLoading(false);
    }
  }, [order, loadRazorpayScript, openRazorpayCheckout, actor]);

  const handleReplySubmit = async (_e: React.FormEvent) => {
    if (!replyMessage.trim() || !replyEmail.trim()) return;
    setReplyStatus("idle");
    addReply.mutate(
      { orderId, message: replyMessage.trim(), senderEmail: replyEmail.trim() },
      {
        onSuccess: () => {
          setReplyMessage("");
          setReplyStatus("success");
          setTimeout(() => setReplyStatus("idle"), 4000);
        },
        onError: () => {
          setReplyStatus("error");
        },
      },
    );
  };

  const handleDeleteClick = (logId: string, messageIndex: number) => {
    setDeleteTarget({ logId, messageIndex });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMessage.mutate(
      { logId: deleteTarget.logId, messageIndex: deleteTarget.messageIndex },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        },
        onError: () => {
          setDeleteDialogOpen(false);
        },
      },
    );
  };

  // Derive isPaid early so it's available before early returns (needed for useEffect)
  const resolvedPaymentStatus = order
    ? resolvePaymentStatus(order.paymentStatus)
    : "Unknown";
  const isPaid = resolvedPaymentStatus === "Paid" || justPaid;
  const isAdvancePaid = resolvedPaymentStatus === "AdvancePaid";
  const hasBalanceDue =
    isAdvancePaid &&
    order &&
    order.totalAmount !== undefined &&
    order.advancePaid !== undefined &&
    Number(order.advancePaid) < Number(order.totalAmount);

  // Start a 10-second fallback timer while loading; clear it when order arrives
  useEffect(() => {
    if (isLoading || (!order && !error)) {
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => setTimedOut(true), 10000);
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setTimedOut(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, order, error]);

  const handleDownload = useCallback(async () => {
    if (!artworkUrl && !order?.finalArtworkKey) return;
    setDownloading(true);
    try {
      if (artworkUrl) {
        const res = await fetch(artworkUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `caricature-${orderId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (order?.finalArtworkKey) {
        const bytes = await order.finalArtworkKey.getBytes();
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `caricature-${orderId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [artworkUrl, orderId, order]);

  // Resolve image URLs from storage keys
  useEffect(() => {
    let cancelled = false;
    async function resolveUrls() {
      if (!order) return;
      if (order.finalArtworkKey) {
        try {
          const key = order.finalArtworkKey as unknown as {
            getDirectURL?: () => string;
            getBytes?: () => Promise<Uint8Array>;
          };
          if (key.getDirectURL) {
            const url = key.getDirectURL();
            if (!cancelled) setArtworkUrl(url);
          } else if (key.getBytes) {
            const bytes = await key.getBytes();
            const blob = new Blob([bytes.buffer as ArrayBuffer]);
            const url = URL.createObjectURL(blob);
            if (!cancelled) setArtworkUrl(url);
          }
        } catch {
          if (!cancelled) setArtworkUrl(null);
        }
      }
    }
    resolveUrls();
    return () => {
      cancelled = true;
    };
  }, [order]);

  // Sync artwork download state with footer context — must be BEFORE early returns
  useEffect(() => {
    if (artworkUrl && isPaid) {
      setArtworkDownload({
        artworkUrl,
        isPaid,
        orderId,
        downloading,
        onDownload: handleDownload,
      });
    } else {
      clearArtworkDownload();
    }
    return () => {
      clearArtworkDownload();
    };
  }, [
    artworkUrl,
    isPaid,
    orderId,
    downloading,
    handleDownload,
    setArtworkDownload,
    clearArtworkDownload,
  ]);

  // Still loading — show spinner with order ID from URL so customer always sees their reference
  if (isLoading || (!order && !error && !timedOut)) {
    return (
      <div
        className="container mx-auto max-w-3xl px-4 py-20 text-center"
        data-ocid="order.loading_state"
      >
        <div className="animate-fade-in">
          {/* Payment confirmed banner — shown immediately from URL state */}
          {justPaid && (
            <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-6 py-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-green-800">
                  Payment Confirmed! 🎉
                </p>
                <p className="text-sm text-green-700">
                  Your caricature order has been placed. Loading your order
                  details...
                </p>
              </div>
            </div>
          )}
          {/* Tracking ID always visible */}
          <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
          <p className="font-mono text-lg font-bold text-primary mb-6 bg-primary/10 rounded-xl py-2 px-4 inline-block">
            {orderId}
          </p>
          {/* Animated spinner */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Loading your order...
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Fetching your order details. This may take a moment right after
            payment.
          </p>
          {/* Skeletons while waiting */}
          <div className="text-left">
            <Card className="rounded-2xl shadow-soft">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-2/3" />
                {/* Pay Now Button for unpaid orders — hidden while order is still loading */}
                {!isPaid && order && (
                  <div className="pt-2">
                    <Button
                      onClick={handlePayNow}
                      disabled={payNowLoading || razorpayLoading}
                      className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm text-base font-semibold py-6 h-auto transition-smooth"
                      data-ocid="order.pay_now_button"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {payNowLoading || razorpayLoading
                        ? "Initializing Payment..."
                        : "Pay Now"}
                    </Button>
                    {payNowError && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-fade-in">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">
                          {payNowError}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Timed out (10s) without loading — show fallback with order ID for manual recovery
  if (timedOut && !order) {
    return (
      <div
        className="container mx-auto max-w-3xl px-4 py-20 text-center"
        data-ocid="order.error_state"
      >
        <div className="animate-fade-in">
          {justPaid && (
            <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-6 py-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-green-800">
                  Payment Confirmed! 🎉
                </p>
                <p className="text-sm text-green-700">
                  Your payment was received successfully.
                </p>
              </div>
            </div>
          )}
          <AlertCircle className="mx-auto h-16 w-16 text-accent mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Taking longer than expected
          </h1>
          <p className="text-muted-foreground mb-2">
            Your payment was received but we're having trouble loading your
            order right now. Your Tracking ID is:
          </p>
          <p className="font-mono text-xl font-bold text-primary mb-6 bg-primary/10 rounded-xl py-3 px-6 inline-block">
            {orderId}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Please save this ID. You can refresh the page to try again or
            contact us at{" "}
            <a
              href="mailto:orders@cherishables.in"
              className="text-primary hover:underline"
            >
              orders@cherishables.in
            </a>{" "}
            with this tracking ID.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => {
                setTimedOut(false);
                refetch();
              }}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="order.retry_button"
            >
              Try Again
            </Button>
            <Link to="/">
              <Button
                variant="outline"
                className="rounded-full"
                data-ocid="order.error_home_button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Hard error from the query (actor error, network error, etc.)
  if (error || !order) {
    return (
      <div
        className="container mx-auto max-w-3xl px-4 py-20 text-center"
        data-ocid="order.error_state"
      >
        <div className="animate-fade-in">
          {justPaid && (
            <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-6 py-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-green-800">
                  Payment Confirmed! 🎉
                </p>
                <p className="text-sm text-green-700">
                  Your payment was received successfully.
                </p>
              </div>
            </div>
          )}
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Order Not Found
          </h1>
          <p className="text-muted-foreground mb-2">
            We couldn't find order{" "}
            <span className="font-mono font-bold">{orderId}</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            If you just completed payment, please wait a moment and try again.
            Still having trouble? Contact us at{" "}
            <a
              href="mailto:orders@cherishables.in"
              className="text-primary hover:underline"
            >
              orders@cherishables.in
            </a>
            .
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => refetch()}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="order.retry_button"
            >
              Retry
            </Button>
            <Link to="/">
              <Button
                variant="outline"
                className="rounded-full"
                data-ocid="order.error_home_button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStage = statusToIndex[order.orderStatus];
  const isDelivered = order.orderStatus === OrderStatus.Delivered;
  const isCompleted = order.orderStatus === OrderStatus.Completed;
  const canDownload = (isDelivered || isCompleted) && order.finalArtworkKey;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      {/* Payment confirmation banner — shown right after successful payment */}
      {(justPaid || isPaid) && (
        <div
          className="mb-6 flex items-center gap-4 rounded-2xl bg-primary/10 border border-primary/30 px-6 py-4 shadow-sm"
          data-ocid="order.payment_confirmed_banner"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">
              Payment Confirmed! 🎉
            </p>
            <p className="text-sm text-green-700">
              Thank you! Your order is confirmed. We'll start working on it
              shortly.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-smooth mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Order Status
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your custom artwork order
        </p>
      </div>

      {/* Order Summary Card */}
      <Card
        className="rounded-2xl shadow-soft mb-8"
        data-ocid="order.summary.card"
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="font-display text-xl">
                Order Summary
              </CardTitle>
              {order.paymentMode && (
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-medium"
                  data-ocid="order.summary.payment_mode_badge"
                >
                  {order.paymentMode === PaymentMode.Advance
                    ? "Advance Payment"
                    : "Full Payment"}
                </Badge>
              )}
              {isAdvancePaid && hasBalanceDue && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium"
                  data-ocid="order.summary.balance_due_badge"
                >
                  Balance Due
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={getPaymentStatusVariant(order.paymentStatus)}
                className={`rounded-full ${
                  isPaid
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : ""
                }`}
              >
                {isPaid ? "✓ Paid" : getPaymentStatusLabel(order.paymentStatus)}
              </Badge>
              {!isPaid && (
                <Button
                  onClick={
                    isAdvancePaid && hasBalanceDue
                      ? handlePayRemainingBalance
                      : handlePayNow
                  }
                  disabled={payNowLoading || razorpayLoading}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm text-sm font-semibold px-4 py-2 h-auto transition-smooth"
                  data-ocid={
                    isAdvancePaid && hasBalanceDue
                      ? "order.pay_remaining_button"
                      : "order.pay_now_button"
                  }
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {payNowLoading || razorpayLoading
                    ? "Initializing..."
                    : isAdvancePaid && hasBalanceDue
                      ? "Pay Remaining Balance"
                      : "Pay Now"}
                </Button>
              )}
            </div>
          </div>
          {payNowError && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 animate-fade-in max-w-xs mt-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{payNowError}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tracking ID</p>
              <p className="font-mono text-foreground font-medium">
                {order.orderId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-foreground font-medium">
                {order.customerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-foreground font-medium">
                {order.customerEmail}
              </p>
            </div>
            {order.customerPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-foreground font-medium">
                  {order.customerPhone}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Portrait Type</p>
              <p className="text-foreground font-medium">
                {getPortraitTypeLabel(order.portraitType)}
              </p>
            </div>
            {order.portraitPrice > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Portrait Price</p>
                <p className="text-foreground font-medium">
                  ₹{(Number(order.portraitPrice) / 100).toLocaleString("en-IN")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Art Style</p>
              <p className="text-foreground font-medium">
                {getArtStyleLabel(order.artStyle)}
              </p>
            </div>
            {order.cartoonStyle && (
              <div>
                <p className="text-sm text-muted-foreground">Cartoon Style</p>
                <p className="text-foreground font-medium">
                  {order.cartoonStyle}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="text-foreground font-medium">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Estimated Delivery
              </p>
              <p className="text-foreground font-medium">
                {order.estimatedDeliveryText ||
                  formatDate(order.estimatedDelivery)}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <Separator />
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Payment Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-foreground font-semibold">
                  ₹
                  {order.totalAmount !== undefined
                    ? (Number(order.totalAmount) / 100).toLocaleString("en-IN")
                    : order.amount
                      ? (Number(order.amount) / 100).toLocaleString("en-IN")
                      : "0"}
                </p>
              </div>
              {order.paymentMode === PaymentMode.Advance && (
                <>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                    <p className="text-sm text-muted-foreground">
                      Advance Paid
                    </p>
                    <p className="text-foreground font-semibold">
                      ₹
                      {order.advancePaid !== undefined
                        ? (Number(order.advancePaid) / 100).toLocaleString(
                            "en-IN",
                          )
                        : "0"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                    <p className="text-sm text-muted-foreground">
                      Remaining Balance
                    </p>
                    <p
                      className={`font-semibold ${
                        hasBalanceDue ? "text-amber-600" : "text-foreground"
                      }`}
                    >
                      ₹
                      {order.totalAmount !== undefined &&
                      order.advancePaid !== undefined
                        ? (
                            Number(order.totalAmount - order.advancePaid) / 100
                          ).toLocaleString("en-IN")
                        : "0"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected Add-Ons */}
          {(() => {
            const addOns = parseSelectedAddOns(order.selectedAddOns);
            if (!addOns.length && Number(order.addOnsAmount) === 0) return null;
            return (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected Products
                  </p>
                  {addOns.length > 0 ? (
                    <div className="space-y-1.5">
                      {addOns.map((addon) => (
                        <div
                          key={addon.name + addon.priceRange}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground font-medium">
                            {addon.name}
                          </span>
                          <span className="text-primary font-semibold">
                            {addon.priceRange}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add-ons selected &mdash; total &#x20b9;
                      {(Number(order.addOnsAmount) / 100).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  )}
                </div>
              </>
            );
          })()}

          {/* Delivery Address */}
          {(() => {
            const addr = parseDeliveryAddress(order.deliveryAddress);
            if (!addr) return null;
            return (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Delivery Address
                  </p>
                  <div className="text-sm space-y-0.5">
                    {addr.fullName && (
                      <p className="font-semibold text-foreground">
                        {addr.fullName}
                      </p>
                    )}
                    <p className="text-muted-foreground">{addr.addressLine1}</p>
                    {addr.addressLine2 && (
                      <p className="text-muted-foreground">
                        {addr.addressLine2}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {[addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {addr.country && (
                      <p className="text-muted-foreground">{addr.country}</p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card
        className="rounded-2xl shadow-soft mb-8"
        data-ocid="order.timeline.card"
      >
        <CardHeader>
          <CardTitle className="font-display text-xl">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {stages.map((stage, index) => {
              const completed = index < currentStage;
              const current = index === currentStage;
              const _pending = index > currentStage;
              const Icon = stage.icon;
              const isLast = index === stages.length - 1;

              return (
                <div
                  key={stage.label}
                  className="flex gap-4"
                  data-ocid={`order.timeline.item.${index + 1}`}
                >
                  {/* Icon column with connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-smooth ${
                        current
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                          completed ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>

                  {/* Text column */}
                  <div className="pt-2 pb-6">
                    <h3
                      className={`font-medium ${
                        current
                          ? "text-primary"
                          : completed
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Final Artwork Section */}
      {canDownload && artworkUrl && (
        <WatermarkedImage
          imageUrl={artworkUrl}
          isPaid={isPaid}
          onDownload={handleDownload}
          downloading={downloading}
          downloadLabel="Download Your Artwork"
          title={isPaid ? "Your Clean Artwork is Ready!" : "Artwork Preview"}
          description={
            isPaid
              ? "Full-resolution artwork — no watermark. Your download is ready."
              : "Complete payment to unlock and download the full clean artwork."
          }
          dataOcid="order.download.card"
        />
      )}
      {canDownload && !artworkUrl && (
        <Card
          className="rounded-2xl shadow-soft border-primary/20 bg-primary/5 mb-8 animate-scale-in"
          data-ocid="order.download.card"
        >
          <CardContent className="p-6 text-center">
            <Download className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Your Artwork is Ready!
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              High-quality HD caricature artwork — watermark-free. Download your
              custom portrait now.
            </p>
            {isPaid ? (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm"
                data-ocid="order.download.button"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Downloading..." : "Download Your Artwork"}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Complete payment to download</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communication with Cherishables */}
      <Card
        className="rounded-2xl shadow-soft mb-8 border-primary/20"
        data-ocid="order.communication.card"
      >
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Communication with Cherishables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages list */}
          <div className="space-y-3 mb-6">
            {commLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-3/4" />
              </div>
            ) : commLogs && commLogs.length > 0 ? (
              commLogs.flatMap((log) =>
                (log.messages || []).map((msg, idx) => (
                  <div
                    key={`${log.id}-${idx}`}
                    className={`flex items-start gap-3 p-3 rounded-xl ${
                      msg.direction === MessageDirection.Sent
                        ? "bg-primary/5 border border-primary/10"
                        : "bg-accent/10 border border-accent/20"
                    }`}
                    data-ocid={`order.communication.item.${idx + 1}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.direction === MessageDirection.Sent
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {msg.direction === MessageDirection.Sent ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <ArrowLeft className="h-4 w-4 rotate-45" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground break-words">
                        {stripHtml(msg.body)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {msg.author ||
                          (msg.direction === MessageDirection.Sent
                            ? "Cherishables"
                            : "You")}{" "}
                        ·{" "}
                        {new Date(
                          Number(msg.timestamp) / 1_000_000,
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(log.id, idx)}
                        disabled={deleteMessage.isPending}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        aria-label="Delete message"
                        data-ocid={`order.communication.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )),
              )
            ) : (
              <div
                className="text-center py-6 text-muted-foreground"
                data-ocid="order.communication.empty_state"
              >
                <MessageCircle className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-sm">No messages yet.</p>
              </div>
            )}
            {deleteMessage.isError && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Failed to delete message. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Reply form */}
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div>
              <Label htmlFor="replyEmail" className="text-sm font-medium">
                Your Email
              </Label>
              <Input
                id="replyEmail"
                type="email"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1 rounded-xl border-border focus-visible:ring-primary"
                data-ocid="order.communication.email_input"
              />
            </div>
            <div>
              <Label htmlFor="replyMessage" className="text-sm font-medium">
                Your Message
              </Label>
              <Textarea
                id="replyMessage"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message here..."
                required
                rows={4}
                className="mt-1 rounded-xl border-border focus-visible:ring-primary resize-none"
                data-ocid="order.communication.message_textarea"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={
                  addReply.isPending ||
                  !replyMessage.trim() ||
                  !replyEmail.trim()
                }
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm"
                data-ocid="order.communication.send_button"
              >
                <Send className="mr-2 h-4 w-4" />
                {addReply.isPending ? "Sending..." : "Send Reply"}
              </Button>
              {replyStatus === "success" && (
                <span className="text-sm text-green-600 font-medium animate-fade-in">
                  Reply sent!
                </span>
              )}
              {replyStatus === "error" && (
                <span className="text-sm text-destructive font-medium animate-fade-in">
                  Failed to send. Please try again.
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* In Progress Message */}
      {!canDownload && (
        <Card
          className="rounded-2xl shadow-soft bg-muted/30 mb-8"
          data-ocid="order.progress.card"
        >
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Your Artwork is Being Handcrafted
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Your artwork is being handcrafted with love by our artist.
              Estimated delivery:{" "}
              <span className="font-medium text-foreground">
                {order?.portraitPrice && Number(order.portraitPrice) > 0
                  ? "4–5 working days"
                  : order?.selectedAddOns &&
                      /3d|miniature|figurine|bobblehead|sculpture|statue/i.test(
                        order.selectedAddOns,
                      )
                    ? "4–5 working days"
                    : "4–5 working days"}
              </span>
              .
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>We'll notify you when it's ready</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-ocid="order.communication.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              data-ocid="order.communication.delete_cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMessage.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="order.communication.delete_confirm_button"
            >
              {deleteMessage.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
