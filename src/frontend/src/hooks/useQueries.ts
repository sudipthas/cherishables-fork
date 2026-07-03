import { type Review as BackendReview, createActor } from "@/backend";
import type { Order, OrderId, PaymentStatus } from "@/backend";
import { convertBackendReview } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetOrder(orderId: OrderId) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Order | null>({
    queryKey: ["getOrder", orderId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrder(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnMount: true,
  });
}

export function usePublicReviews() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<[string, import("@/types").Review]>>({
    queryKey: ["publicReviews"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getPublicReviews();
      return result.map(([id, review]) => [id, convertBackendReview(review)]);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
    gcTime: 600000,
  });
}

export function useSubmitReview() {
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
      return actor.submitReview(p.name, p.text, p.rating, p.imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicReviews"] });
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
    },
  });
}

export function useListPendingReviews() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<[string, import("@/types").Review]>>({
    queryKey: ["pendingReviews"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.listPendingReviews();
      return result.map(([id, review]) => [id, convertBackendReview(review)]);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
    gcTime: 600000,
  });
}

export function useApproveReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.approveReview(id);
      if (!result) throw new Error("Review not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
      queryClient.invalidateQueries({ queryKey: ["publicReviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useRejectReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.rejectReview(id);
      if (!result) throw new Error("Review not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
      queryClient.invalidateQueries({ queryKey: ["publicReviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
    }: {
      orderId: OrderId;
      paymentStatus: PaymentStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updatePaymentStatus(orderId, paymentStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllOrders"] });
      queryClient.invalidateQueries({ queryKey: ["getOrder"] });
    },
  });
}
