import {
  type AdminEmailConfig,
  type CommunicationLog,
  type EmailTemplate,
  type ReviewStatus,
  type SendTemplateEmailRequest,
  type SendTemplateEmailResponse,
  type UpdateAdminEmailConfigRequest,
  createActor,
} from "@/backend";
import type {
  EmailTemplateId,
  Order,
  OrderId,
  OrderStatus,
  Review,
  AddonProduct as _AddonProduct,
} from "@/backend";

// Extend AddonProduct to include the optional displayOrder field the backend now returns
export type AddonProduct = _AddonProduct & { displayOrder?: bigint };
import { loadConfig, useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob, StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListAllOrders() {
  const { actor, isFetching } = useActor(createActor);
  const query = useQuery<Order[]>({
    queryKey: ["listAllOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    refetchOrders: query.refetch,
  };
}

export function useUpdateOrderStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: OrderId;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
    },
  });
}

export function useUploadFinalArtwork() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      file,
    }: {
      orderId: OrderId;
      file: File;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await actor.uploadFinalArtwork(orderId, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
    },
  });
}

export function useSaveRazorpayKeys() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({
      keyId,
      keySecret,
    }: { keyId: string; keySecret: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveRazorpayKeys(keyId, keySecret);
    },
  });
}

export function useGetRazorpayKeyId() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string | null>({
    queryKey: ["getRazorpayKeyId"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getRazorpayKeyId();
      if (!result) return null;
      return result;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.deleteOrder(orderId);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
    },
  });
}

export function useListProducts() {
  const { actor, isFetching } = useActor(createActor);
  const query = useQuery<AddonProduct[]>({
    queryKey: ["listProducts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
    gcTime: 600000,
  });
  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useAddProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      name: string;
      price: bigint;
      category: string;
      imageUrl: string;
      description?: string;
      codEnabled?: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProduct(
        p.name ?? "",
        p.price,
        p.category ?? "",
        p.imageUrl ?? "",
        p.codEnabled ?? false,
        p.description ?? "",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      name: string;
      price: bigint;
      category: string;
      imageUrl: string;
      description?: string;
      codEnabled?: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.updateProduct(
        p.id ?? "",
        p.name ?? "",
        p.price,
        p.category ?? "",
        p.imageUrl ?? "",
        p.codEnabled ?? false,
        p.description ?? "",
      );
      if (!ok) throw new Error("Product not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useToggleProductCOD() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      codEnabled,
    }: { id: string; codEnabled: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleProductCOD(id, codEnabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.deleteProduct(id);
      if (!ok) throw new Error("Product not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useUpdateProductImage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateProductImage(id ?? "", imageUrl ?? "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useSetAdminEmail() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateAdminEmailConfig({
        adminEmail: email,
        isEnabled: true,
        fromName: "Admin",
        replyTo: email,
      });
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const config = await loadConfig();
      const agent = new HttpAgent({
        host: config.backend_host ?? "https://icp0.io",
      });
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes);
      return storageClient.getDirectURL(hash);
    },
  });
}

export function useMoveProductUp() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.moveProductUp(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

export function useMoveProductDown() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.moveProductDown(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
    },
  });
}

import type {
  BrowseLeadInput,
  CartLead,
  CartLeadInput,
  Lead,
  Product,
  SalesRep,
} from "@/types";

export function useCartLeads() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CartLead[]>({
    queryKey: ["cartLeads"],
    queryFn: async () => {
      if (!actor) return [];
      const backendActor = actor as unknown as {
        getCartLeads: () => Promise<Array<CartLead>>;
      };
      const leads = await backendActor.getCartLeads();
      return [...leads].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCartLeadStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        updateCartLeadStatus: (id: bigint, status: string) => Promise<void>;
      };
      await backendActor.updateCartLeadStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
    },
  });
}

export function useSaveCartLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CartLeadInput) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        saveCartLead: (input: CartLeadInput) => Promise<CartLead>;
      };
      return backendActor.saveCartLead(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
    },
  });
}

export function useSaveCheckoutLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      phone: string;
      productIds: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        saveCheckoutLead: (input: {
          name: string;
          phone: string;
          productIds: string[];
        }) => Promise<CartLead>;
      };
      return backendActor.saveCheckoutLead(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
    },
  });
}

export function useSaveBrowseLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BrowseLeadInput) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        saveBrowseLead: (input: BrowseLeadInput) => Promise<CartLead>;
      };
      return backendActor.saveBrowseLead(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
    },
  });
}

export function useListLeads() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!actor) return [];
      const leads = await actor.listLeads();
      return [...leads].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    },
    enabled: !!actor && !isFetching,
  });
}
export function useUpdateLeadStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateLeadStatus(id, status);
      if (result && "err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
export function useDeleteCartLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        deleteCartLead: (id: bigint) => Promise<boolean>;
      };
      const ok = await backendActor.deleteCartLead(id);
      if (!ok) throw new Error("Cart lead not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
    },
  });
}
export function useDeleteLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.deleteLead(id);
      if (!ok) throw new Error("Lead not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
export function useSaveLead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      email,
      subject,
      message,
    }: {
      name: string;
      phone: string;
      email: string;
      subject: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.saveLead(name, phone, email, subject, message);
      if (result && "err" in result) throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
export function useListReviews() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<[string, Review]>>({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReviews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      name: string;
      text: string;
      rating: bigint;
      imageUrl: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReview(p.name, p.text, p.rating, p.imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useUpdateReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      name: string;
      text: string;
      rating: bigint;
      imageUrl: string | null;
      status: ReviewStatus | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateReview(
        p.id,
        p.name,
        p.text,
        p.rating,
        p.imageUrl,
        p.status,
      );
      if (!result) throw new Error("Review not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["publicReviews"] });
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.deleteReview(id);
      if (!ok) throw new Error("Review not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["publicReviews"] });
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
    },
  });
}

export function useUploadReviewImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const config = await loadConfig();
      const agent = new HttpAgent({
        host: config.backend_host ?? "https://icp0.io",
      });
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes);
      return storageClient.getDirectURL(hash);
    },
  });
}

export function useListEmailTemplates() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<EmailTemplate[]>({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEmailTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendTemplateEmail() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: SendTemplateEmailRequest) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendTemplateEmail(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communicationLogs"] });
    },
  });
}

export function useListCommunicationLogs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CommunicationLog[]>({
    queryKey: ["communicationLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllCommunicationLogs();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetAdminEmailConfig() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminEmailConfig>({
    queryKey: ["adminEmailConfig"],
    queryFn: async () => {
      if (!actor)
        return {
          adminEmail: "orders@cherishables.in",
          fromName: "Cherishables",
          isEnabled: true,
          replyTo: "orders@cherishables.in",
        };
      return actor.getAdminEmailConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateAdminEmailConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: UpdateAdminEmailConfigRequest) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAdminEmailConfig(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminEmailConfig"] });
    },
  });
}

export function useGetPublicCommunicationLogs(orderId: OrderId) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CommunicationLog[]>({
    queryKey: ["publicCommunicationLogs", orderId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicCommunicationLogs(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId,
    refetchInterval: 10000,
  });
}

export function useAddCustomerReplyPublic() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      message,
      senderEmail,
    }: {
      orderId: OrderId;
      message: string;
      senderEmail: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addCustomerReplyPublic(orderId, message, senderEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicCommunicationLogs"] });
    },
  });
}

export function useNotificationCounts() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<{
    unreadOrders: number;
    unreadMessages: number;
    total: number;
  }>({
    queryKey: ["notificationCounts"],
    queryFn: async () => {
      if (!actor) return { unreadOrders: 0, unreadMessages: 0, total: 0 };

      const [orders, logs] = await Promise.all([
        actor.listAllOrders(),
        actor.listAllCommunicationLogs(),
      ]);

      const seenOrderIds = new Set<string>(
        JSON.parse(localStorage.getItem("cherishables_seen_orders") || "[]"),
      );
      const seenMessageTs = Number(
        localStorage.getItem("cherishables_seen_messages") || "0",
      );

      const unreadOrders = orders.filter(
        (o) =>
          o.paymentStatus &&
          (o.paymentStatus === "Pending" || o.paymentStatus === "Paid") &&
          !seenOrderIds.has(o.orderId),
      ).length;

      const unreadMessages = logs.reduce((count, log) => {
        const receivedCount = log.messages.filter(
          (m) =>
            m.direction === "Received" && Number(m.timestamp) > seenMessageTs,
        ).length;
        return count + receivedCount;
      }, 0);

      return {
        unreadOrders,
        unreadMessages,
        total: unreadOrders + unreadMessages,
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderIds,
      messageTimestamp,
    }: {
      orderIds?: string[];
      messageTimestamp?: bigint;
    }) => {
      if (orderIds && orderIds.length > 0) {
        const existing = new Set<string>(
          JSON.parse(localStorage.getItem("cherishables_seen_orders") || "[]"),
        );
        for (const id of orderIds) existing.add(id);
        localStorage.setItem(
          "cherishables_seen_orders",
          JSON.stringify(Array.from(existing)),
        );
      }
      if (messageTimestamp) {
        localStorage.setItem(
          "cherishables_seen_messages",
          String(Number(messageTimestamp)),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationCounts"] });
    },
  });
}

export function useSendPaymentReminder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Actor not available");
      // sendPaymentReminder is available at runtime but not yet in generated bindings
      const backendActor = actor as unknown as {
        sendPaymentReminder: (
          orderId: OrderId,
        ) => Promise<SendTemplateEmailResponse>;
      };
      return backendActor.sendPaymentReminder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communicationLogs"] });
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
    },
  });
}

export function useAddCustomerReply() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      templateId,
      body,
    }: {
      orderId: OrderId;
      templateId: EmailTemplateId;
      body: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addCustomerReply(orderId, templateId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communicationLogs"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      if (!actor) throw new Error("Actor not available");
      // deleteCommunicationLog may be available at runtime but not yet in generated bindings
      const backendActor = actor as unknown as {
        deleteCommunicationLog: (logId: string) => Promise<boolean>;
      };
      const ok = await backendActor.deleteCommunicationLog(logId);
      if (!ok) throw new Error("Message not found or could not be deleted");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communicationLogs"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCounts"] });
    },
  });
}

export function useDeleteCommunicationMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      logId,
      messageIndex,
    }: {
      logId: string;
      messageIndex: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // deleteCommunicationMessage may be available at runtime but not in generated bindings
      const backendActor = actor as unknown as {
        deleteCommunicationMessage: (
          logId: string,
          messageIndex: bigint,
        ) => Promise<
          { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
        >;
      };
      if (!backendActor.deleteCommunicationMessage) {
        throw new Error(
          "Delete message feature is not available on this backend version",
        );
      }
      const result = await backendActor.deleteCommunicationMessage(
        logId,
        BigInt(messageIndex),
      );
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicCommunicationLogs"] });
      queryClient.invalidateQueries({ queryKey: ["communicationLogs"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Team portal hooks (founder + sales rep access)
// ---------------------------------------------------------------------------

export function useIsCallerSalesRep() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isCallerSalesRep"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerSalesRep();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerFounder() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isCallerFounder"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerFounder();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListSalesReps() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SalesRep[]>({
    queryKey: ["salesReps"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSalesReps();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSalesRep() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      email,
      name,
      phone,
    }: {
      principal: string;
      email: string | null;
      name?: string;
      phone?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.addSalesRep(
        principal,
        email,
        name?.trim() ? name : null,
        phone?.trim() ? phone : null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesReps"] });
    },
  });
}

export function useAssignLeadToRep() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cartLeadId,
      repPrincipal,
    }: {
      cartLeadId: bigint;
      repPrincipal: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.assignLeadToRep(cartLeadId, repPrincipal);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartLeads"] });
      queryClient.invalidateQueries({ queryKey: ["teamCartLeads"] });
    },
  });
}

export function useRemoveSalesRep() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.removeSalesRep(principal);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesReps"] });
    },
  });
}

export function useTeamListProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Product[]>({
    queryKey: ["teamProducts"],
    queryFn: async () => {
      if (!actor) return [];
      const products = await actor.teamListProducts();
      return products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category: p.category,
        imageUrl: p.imageUrl,
        codEnabled: p.codEnabled,
        description: p.description ?? undefined,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeamListCartLeads() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CartLead[]>({
    queryKey: ["teamCartLeads"],
    queryFn: async () => {
      if (!actor) return [];
      const leads = await actor.teamListCartLeads();
      return [...leads].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeamListLeads() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Lead[]>({
    queryKey: ["teamLeads"],
    queryFn: async () => {
      if (!actor) return [];
      const leads = await actor.teamListLeads();
      return [...leads].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeamListOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Order[]>({
    queryKey: ["teamOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.teamListOrders();
      return [...orders].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeamUpdateCartLeadStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.teamUpdateCartLeadStatus(id, status);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamCartLeads"] });
    },
  });
}

export function useTeamUpdateLeadStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.teamUpdateLeadStatus(id, status);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamLeads"] });
    },
  });
}
