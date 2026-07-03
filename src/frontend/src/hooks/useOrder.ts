import { PaymentMethod, PaymentMode, createActor } from "@/backend";
import type {
  DeliveryAddress as BackendDeliveryAddress,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderItem,
  RazorpayOrderDetails,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Global type declaration for Razorpay checkout
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  interface Window {
    Razorpay: {
      new (options: Record<string, unknown>): { open(): void };
    };
  }
}

export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export type PortraitType = "single" | "couple" | "family" | "group";

export interface OrderFormData {
  photoFiles: File[];
  customerName: string;
  customerEmail: string;
  notes: string;
  customerPhone: string;
  portraitType: PortraitType;
  portraitPrice: number;
  cartoonStyle: string;
  customerApproval: boolean;
  addOns: Array<{ productName: string; quantity: number; unitPrice: number }>;
  deliveryAddress: DeliveryAddress;
  address: string;
  pincode: string;
  is3DModel: boolean;
  customerAcknowledged: boolean;
  specialInstructions: string;
}

export function useOrder() {
  const { actor } = useActor(createActor);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>({
    photoFiles: [],
    customerName: "",
    customerEmail: "",
    notes: "",
    customerPhone: "",
    portraitType: "single",
    portraitPrice: 0,
    cartoonStyle: "",
    customerApproval: false,
    addOns: [],
    deliveryAddress: {
      fullName: "",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
      addressLine2: "",
      country: "India",
    },
    address: "",
    pincode: "",
    is3DModel: false,
    customerAcknowledged: false,
    specialInstructions: "",
  });
  // formDataRef prevents stale closures in mutation callbacks
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [orderId, setOrderId] = useState("");
  const orderIdRef = useRef("");
  const [orderAmount, setOrderAmount] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );

  const updateFormData = useCallback((updates: Partial<OrderFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      formDataRef.current = next;
      return next;
    });
  }, []);

  const updateDeliveryAddress = useCallback(
    (updates: Partial<DeliveryAddress>) => {
      setFormData((prev) => {
        const next = {
          ...prev,
          deliveryAddress: { ...prev.deliveryAddress, ...updates },
        };
        formDataRef.current = next;
        return next;
      });
    },
    [],
  );

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 3)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  // Confirm Razorpay payment after checkout modal success
  const confirmRazorpayPayment = useMutation({
    mutationFn: async ({
      paymentId,
      razorpayOrderId,
      signature,
    }: {
      paymentId: string;
      razorpayOrderId: string;
      signature: string;
    }): Promise<string> => {
      if (!actor)
        throw new Error("Actor not available. Please refresh and try again.");
      const currentOrderId = orderIdRef.current || orderId;
      if (!currentOrderId)
        throw new Error("No order found. Please start over.");

      const result = await actor.confirmRazorpayPayment(
        currentOrderId,
        paymentId,
        razorpayOrderId,
        signature,
      );
      if (result.__kind__ === "err") {
        throw new Error(
          result.err || "Payment confirmation failed. Please try again.",
        );
      }
      return currentOrderId;
    },
    onSuccess: async (confirmedOrderId) => {
      toast.success("Payment successful! Redirecting to your order status...");
      queryClient.setQueryData(
        ["getOrder", confirmedOrderId],
        (old: unknown) => {
          if (old && typeof old === "object") {
            return {
              ...(old as Record<string, unknown>),
              paymentStatus: { Paid: null },
            };
          }
          return old;
        },
      );
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
      queryClient.invalidateQueries({
        queryKey: ["getOrder", confirmedOrderId],
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      navigate({
        to: "/order-status/$orderId",
        params: { orderId: confirmedOrderId },
        search: { paid: "1" },
      });
    },
    onError: (err: Error) => {
      setPaymentError(err.message);
      toast.error(err.message);
    },
  });

  // Load Razorpay checkout script dynamically with verification
  const loadRazorpayScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If script already loaded and Razorpay is available, resolve immediately
      if (
        document.getElementById("razorpay-checkout-script") &&
        typeof window.Razorpay !== "undefined"
      ) {
        resolve();
        return;
      }

      // If script tag exists but Razorpay not ready yet, wait for it
      const existingScript = document.getElementById(
        "razorpay-checkout-script",
      );
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (typeof window.Razorpay !== "undefined") {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(
            new Error(
              "Razorpay checkout script loaded but Razorpay object is not available. Please check your network connection and try again.",
            ),
          );
        }, 10000);
        return;
      }

      // Create and load the script
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        // Defensive delay to ensure window.Razorpay is fully initialized
        setTimeout(() => {
          if (typeof window.Razorpay === "undefined") {
            reject(
              new Error(
                "Razorpay script loaded but window.Razorpay is undefined. This may be due to a network issue or script blocking.",
              ),
            );
            return;
          }
          resolve();
        }, 100);
      };

      script.onerror = () => {
        reject(
          new Error(
            "Failed to load Razorpay checkout script. Please check your internet connection and try again.",
          ),
        );
      };

      document.body.appendChild(script);
    });
  }, []);

  // Open Razorpay inline checkout using backend-returned order details
  const openRazorpayCheckout = useCallback(
    async (
      razorpayOrder: RazorpayOrderDetails,
      customerName: string,
      customerEmail: string,
      description: string,
      orderId?: string,
    ): Promise<void> => {
      if (orderId) {
        orderIdRef.current = orderId;
        setOrderId(orderId);
      }

      setRazorpayLoading(true);
      setPaymentError(null);

      try {
        // Log the exact razorpayOrder object before validation
        console.log("[openRazorpayCheckout] raw razorpayOrder:", razorpayOrder);

        // Normalize field names: backend may return snake_case (key_id, order_id)
        // while the TypeScript interface declares camelCase (keyId, orderId).
        // The Candid decoder passes record fields through verbatim, so we must
        // map both variants to ensure robustness.
        const raw = razorpayOrder as unknown as Record<string, unknown>;
        const normalizedOrder = {
          keyId:
            (raw.keyId as string | undefined) ??
            (raw.key_id as string | undefined) ??
            "",
          orderId:
            (raw.orderId as string | undefined) ??
            (raw.order_id as string | undefined) ??
            "",
          amount: (raw.amount as bigint | null | undefined) ?? null,
          currency: (raw.currency as string | undefined) ?? "",
        } as RazorpayOrderDetails;

        console.log(
          "[openRazorpayCheckout] normalized razorpayOrder:",
          normalizedOrder,
        );

        // Validate required Razorpay order fields
        // Use explicit undefined/null/empty string checks instead of ! operator
        const isMissingKeyId =
          normalizedOrder.keyId === undefined ||
          normalizedOrder.keyId === null ||
          normalizedOrder.keyId === "";
        const isMissingOrderId =
          normalizedOrder.orderId === undefined ||
          normalizedOrder.orderId === null ||
          normalizedOrder.orderId === "";
        const isMissingAmount =
          normalizedOrder.amount === undefined ||
          normalizedOrder.amount === null;
        const isMissingCurrency =
          normalizedOrder.currency === undefined ||
          normalizedOrder.currency === null ||
          normalizedOrder.currency === "";

        if (
          isMissingKeyId ||
          isMissingOrderId ||
          isMissingAmount ||
          isMissingCurrency
        ) {
          const missingFields: string[] = [];
          if (isMissingKeyId) missingFields.push("keyId");
          if (isMissingOrderId) missingFields.push("orderId");
          if (isMissingAmount) missingFields.push("amount");
          if (isMissingCurrency) missingFields.push("currency");
          throw new Error(
            `Invalid Razorpay order details. Missing required fields (${missingFields.join(", ")}).`,
          );
        }

        await loadRazorpayScript();

        // Double-check Razorpay is available after script load
        if (typeof window.Razorpay === "undefined") {
          throw new Error(
            "Razorpay checkout is not available. Please refresh the page and try again.",
          );
        }

        const options = {
          key: normalizedOrder.keyId,
          amount: Number(normalizedOrder.amount),
          currency: normalizedOrder.currency,
          order_id: normalizedOrder.orderId,
          name: "Cherishables",
          description,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: "",
          },
          // Use regular function (not async arrow) for SDK compatibility
          handler: (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            Promise.resolve()
              .then(() =>
                confirmRazorpayPayment.mutateAsync({
                  paymentId: response.razorpay_payment_id ?? "",
                  razorpayOrderId: response.razorpay_order_id ?? "",
                  signature: response.razorpay_signature ?? "",
                }),
              )
              .catch((err: unknown) => {
                // Log unexpected errors; mutation onError handles expected ones
                if (err instanceof Error && !err.message.includes("mutation")) {
                  console.error("Razorpay handler error:", err);
                }
              });
          },
          modal: {
            ondismiss: () => {
              setRazorpayLoading(false);
              toast.info(
                "Payment window closed. Your order is pending — you can complete payment from your order status page.",
              );
            },
          },
        };

        // Wrap Razorpay instantiation in try/catch for safety
        let rzp: { open(): void };
        try {
          rzp = new window.Razorpay(options);
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to initialize Razorpay checkout. Please try again.";
          throw new Error(msg);
        }

        rzp.open();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Payment setup failed. Please try again.";
        setPaymentError(msg);
        toast.error(msg);
        throw err; // Re-throw so callers can handle it
      } finally {
        setRazorpayLoading(false);
      }
    },
    [loadRazorpayScript, confirmRazorpayPayment],
  );

  // Pre-load Razorpay script when user reaches step 3
  useEffect(() => {
    if (step === 3) {
      loadRazorpayScript().catch(() => {
        // Silently fail pre-load; we'll show error when user actually tries to pay
      });
    }
  }, [step, loadRazorpayScript]);

  // Helper to build OrderItem array from cart or buy-now.
  // IMPORTANT: item.price must be in rupees (INR). This helper multiplies by 100
  // to convert to paise for the backend.
  function buildOrderItems(
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
      flowType: string;
    }>,
  ): OrderItem[] {
    return items.map((item) => ({
      productId: item.productId,
      name: item.name,
      // item.price is in rupees; backend expects paise
      price: BigInt(Math.round(item.price * 100)),
      quantity: BigInt(item.quantity),
      image: item.image,
      flowType: item.flowType,
      itemImages: [item.image],
    }));
  }

  // Helper to build the CreateOrderRequest with all required fields
  async function buildRequest(
    payMethod: PaymentMethod,
    addOnsAmount: number,
    data: OrderFormData,
    orderItems: OrderItem[] = [],
    paymentMode: PaymentMode = PaymentMode.Full,
  ): Promise<CreateOrderRequest> {
    const hasAddress = data.deliveryAddress?.addressLine1?.trim();
    const hasAddOns = data.addOns && data.addOns.length > 0;

    // Build selectedAddOns as a JSON string
    const selectedAddOnsStr = hasAddOns
      ? JSON.stringify(
          data.addOns.map((a) => ({
            name: a.productName,
            priceRange: `\u20b9${a.unitPrice.toLocaleString()}`,
            category: "Add-On",
          })),
        )
      : undefined;

    // Build deliveryAddress for backend (only when address is present)
    const deliveryAddress: BackendDeliveryAddress | undefined = hasAddress
      ? {
          fullName: data.deliveryAddress.fullName || "",
          addressLine1: data.deliveryAddress.addressLine1 || "",
          addressLine2: data.deliveryAddress.addressLine2 || "",
          city: data.deliveryAddress.city || "",
          state: data.deliveryAddress.state || "",
          pincode: data.deliveryAddress.pincode || "",
          country: data.deliveryAddress.country || "India",
        }
      : undefined;

    // Keep notes clean — actual customer notes only, no JSON injection
    const notesText = data.notes.trim();

    // Upload all photos and get their blobs
    const photoBlobs: ReturnType<typeof ExternalBlob.fromBytes>[] = [];
    for (const file of data.photoFiles) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      photoBlobs.push(blob);
    }

    return {
      customerName: data.customerName.trim() || "Customer",
      customerEmail: data.customerEmail.trim() || "",
      notes: notesText,
      photoKeys: photoBlobs,
      portraitType: data.portraitType || undefined,
      portraitPrice: data.portraitPrice
        ? BigInt(Math.round(data.portraitPrice * 100))
        : 0n,
      customerPhone: data.customerPhone?.trim() || "",
      addOnsAmount: BigInt(Math.round(addOnsAmount)),
      paymentMethod: payMethod,
      deliveryAddress: deliveryAddress ?? {
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      },
      selectedAddOns: selectedAddOnsStr ?? "",
      cartoonStyle: data.cartoonStyle?.trim() || "",
      referredBy: "",
      customerId: "",
      orderItems,
      address: data.address?.trim() || "",
      pincode: data.pincode?.trim() || "",
      is3DModel: data.is3DModel ?? false,
      customerAcknowledged: data.customerAcknowledged ?? false,
      paymentMode,
      specialInstructions: data.specialInstructions
        ? data.specialInstructions.trim()
        : undefined,
    };
  }

  // Validate checkout form data
  function validateCheckoutData(
    data: OrderFormData,
    isAvailableModels = false,
  ): string | null {
    if (!isAvailableModels && data.photoFiles.length === 0)
      return "Please upload at least one photo";
    if (!data.customerName.trim()) return "Please enter your full name";
    if (!data.customerEmail.trim()) return "Please enter your email";
    if (!data.customerPhone.trim()) return "Please enter your phone number";
    if (!data.address.trim()) return "Please enter your address";
    if (!data.pincode.trim()) return "Please enter your pincode";
    if (data.is3DModel && !data.customerAcknowledged)
      return "Please acknowledge the 3D model terms";
    return null;
  }

  // Create single order (Buy Now or legacy portrait flow)
  const createOrder = useMutation<
    CreateOrderResponse,
    Error,
    {
      addOnsAmount?: number;
      orderItems?: OrderItem[];
      paymentMode?: PaymentMode;
    }
  >({
    mutationFn: async ({
      addOnsAmount = 0,
      orderItems = [],
      paymentMode = PaymentMode.Full,
    }): Promise<CreateOrderResponse> => {
      if (!actor)
        throw new Error("Actor not available. Please refresh and try again.");

      const currentData = formDataRef.current;
      const isAvailableModels =
        orderItems.length > 0 &&
        orderItems.every((item) => item.flowType === "available_models");
      const validationError = validateCheckoutData(
        currentData,
        isAvailableModels,
      );
      if (validationError) throw new Error(validationError);

      const request = await buildRequest(
        PaymentMethod.Razorpay,
        addOnsAmount,
        currentData,
        orderItems,
        paymentMode,
      );

      const result: CreateOrderResponse = await actor.createOrder(request);
      const newOrderId = result.orderId ?? "";
      if (!newOrderId) {
        throw new Error("Failed to create order. Please try again.");
      }
      orderIdRef.current = newOrderId;
      setOrderId(newOrderId);
      // result.amount is in paise (backend/Razorpay unit); store in rupees for UI
      setOrderAmount(Number(result.amount ?? 0) / 100);
      setShowPaymentUI(true);
      return result;
    },
    onError: (err: Error) => {
      setPaymentError(err.message);
    },
    onMutate: () => {
      setPaymentError(null);
    },
  });

  // Create bulk order (cart checkout)
  const createBulkOrder = useMutation<
    CreateOrderResponse,
    Error,
    {
      addOnsAmount?: number;
      orderItems: OrderItem[];
      paymentMode?: PaymentMode;
    }
  >({
    mutationFn: async ({
      addOnsAmount = 0,
      orderItems,
      paymentMode = PaymentMode.Full,
    }): Promise<CreateOrderResponse> => {
      if (!actor)
        throw new Error("Actor not available. Please refresh and try again.");

      const currentData = formDataRef.current;
      const isAvailableModels =
        orderItems.length > 0 &&
        orderItems.every((item) => item.flowType === "available_models");
      const validationError = validateCheckoutData(
        currentData,
        isAvailableModels,
      );
      if (validationError) throw new Error(validationError);

      const request = await buildRequest(
        PaymentMethod.Razorpay,
        addOnsAmount,
        currentData,
        orderItems,
        paymentMode,
      );

      const result: CreateOrderResponse = await actor.createBulkOrder(request);
      const newOrderId = result.orderId ?? "";
      if (!newOrderId) {
        throw new Error("Failed to create order. Please try again.");
      }
      orderIdRef.current = newOrderId;
      setOrderId(newOrderId);
      // result.amount is in paise (backend/Razorpay unit); store in rupees for UI
      setOrderAmount(Number(result.amount ?? 0) / 100);
      setShowPaymentUI(true);
      return result;
    },
    onError: (err: Error) => {
      setPaymentError(err.message);
    },
    onMutate: () => {
      setPaymentError(null);
    },
  });

  // Create order for COD flow
  const createCODOrder = useMutation<
    string,
    Error,
    { addOnsAmount?: number; orderItems?: OrderItem[] }
  >({
    mutationFn: async ({
      addOnsAmount = 0,
      orderItems = [],
    }): Promise<string> => {
      if (!actor)
        throw new Error("Actor not available. Please refresh and try again.");

      const currentData = formDataRef.current;
      const isAvailableModels =
        orderItems.length > 0 &&
        orderItems.every((item) => item.flowType === "available_models");
      const validationError = validateCheckoutData(
        currentData,
        isAvailableModels,
      );
      if (validationError) throw new Error(validationError);

      const request = await buildRequest(
        PaymentMethod.COD,
        addOnsAmount,
        currentData,
        orderItems,
        PaymentMode.Full,
      );

      const result = await actor.createOrder(request);
      const newOrderId = result.orderId ?? "";
      if (!newOrderId) {
        throw new Error("Failed to create order. Please try again.");
      }
      orderIdRef.current = newOrderId;
      setOrderId(newOrderId);
      // result.amount is in paise (backend/Razorpay unit); store in rupees for UI
      setOrderAmount(Number(result.amount ?? 0) / 100);
      return newOrderId;
    },
    onSuccess: (codOrderId) => {
      toast.success("Order placed successfully! Redirecting to order status…");
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
      queryClient.invalidateQueries({ queryKey: ["getOrder", codOrderId] });
      navigate({
        to: "/order-status/$orderId",
        params: { orderId: codOrderId },
        search: { cod: "1" },
      });
    },
    onError: (err: Error) => {
      setPaymentError(err.message);
      toast.error(err.message);
    },
    onMutate: () => {
      setPaymentError(null);
    },
  });

  return {
    step,
    formData,
    uploadProgress,
    orderId,
    orderIdRef,
    orderAmount,
    paymentError,
    showPaymentUI,
    razorpayLoading,
    actor,
    setOrderId,
    setPaymentError,
    updateFormData,
    updateDeliveryAddress,
    nextStep,
    prevStep,
    createOrder,
    createBulkOrder,
    confirmRazorpayPayment,
    loadRazorpayScript,
    openRazorpayCheckout,
    setRazorpayLoading,
    paymentMethod,
    setPaymentMethod,
    createCODOrder,
    validateCheckoutData,
    buildOrderItems,
  };
}
