import { createActor } from "@/backend";
import type { CartItem, CartResponse } from "@/backend";
import { formatPrice } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const SESSION_KEY = "cherishables_session_id";

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

export function computeCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = Number(item.price);
    const qty = Number(item.quantity);
    return sum + (price * qty) / 100;
  }, 0);
}

export function useCartGet() {
  const { actor, isFetching } = useActor(createActor);
  const sessionId = getSessionId();
  return useQuery<CartResponse>({
    queryKey: ["cart", sessionId],
    queryFn: async () => {
      if (!actor) return { message: "Actor not ready", success: false };
      return actor.getCart(sessionId, null);
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
  });
}

export function useCartAdd() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  return useMutation<CartResponse, Error, CartItem>({
    mutationFn: async (item) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addToCart(sessionId, null, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCartRemove() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  return useMutation<CartResponse, Error, string>({
    mutationFn: async (productId) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeFromCart(sessionId, null, productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCartUpdateQuantity() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  return useMutation<
    CartResponse,
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: async ({ productId, quantity }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateQuantity(sessionId, null, productId, BigInt(quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCartClear() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  return useMutation<CartResponse, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.clearCart(sessionId, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCartCheckout() {
  const { actor } = useActor(createActor);
  const sessionId = getSessionId();
  return useMutation<CartResponse, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCart(sessionId);
    },
  });
}
