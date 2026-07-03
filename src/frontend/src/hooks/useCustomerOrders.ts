import { createActor } from "@/backend";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useGetOrdersByCustomer() {
  const { actor, isFetching } = useActor(createActor);
  const { customer, isLoggedIn } = useCustomerAuth();

  return useQuery({
    queryKey: ["ordersByCustomer", customer?.id],
    queryFn: async () => {
      if (!actor || !customer) return [];
      return actor.getOrdersByCustomer(customer.id);
    },
    enabled: !!actor && !isFetching && isLoggedIn && !!customer,
    staleTime: 30000,
    refetchInterval: 10000,
  });
}

export function useLinkAnonymousOrders() {
  const { actor, isFetching } = useActor(createActor);
  const { customer, isLoggedIn } = useCustomerAuth();

  return useQuery({
    queryKey: ["linkAnonymousOrders", customer?.id],
    queryFn: async () => {
      if (!actor || !customer) return [];
      return actor.linkAnonymousOrders(
        customer.phone,
        customer.phone,
        customer.id,
      );
    },
    enabled: !!actor && !isFetching && isLoggedIn && !!customer,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
