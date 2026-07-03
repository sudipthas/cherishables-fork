import {
  type MobileWebAppSettings,
  type WebsiteSettings,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  siteName: "Cherishables",
  logoUrl: "/assets/logo.png",
  primaryColor: "#dc2626",
  secondaryColor: "#d4a017",
  contactEmail: "orders@cherishables.in",
  contactPhone: "+91 84312 74009",
  instagramUrl: "https://instagram.com/cherishables.in",
  whatsappNumber: "+91 84312 74009",
  heroVideoIds: [],
};

const DEFAULT_MOBILE_SETTINGS: MobileWebAppSettings = {
  appName: "Cherishables",
  splashScreenUrl: "/assets/logo.png",
  primaryColor: "#dc2626",
  secondaryColor: "#d4a017",
  heroVideoIds: [],
};

export function useWebsiteSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WebsiteSettings>({
    queryKey: ["websiteSettings"],
    queryFn: async () => {
      if (!actor) return DEFAULT_WEBSITE_SETTINGS;
      return actor.getWebsiteSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateWebsiteSettings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: WebsiteSettings) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWebsiteSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteSettings"] });
    },
  });
}

export function useMobileWebAppSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MobileWebAppSettings>({
    queryKey: ["mobileWebAppSettings"],
    queryFn: async () => {
      if (!actor) return DEFAULT_MOBILE_SETTINGS;
      return actor.getMobileWebAppSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateMobileWebAppSettings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: MobileWebAppSettings) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateMobileWebAppSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobileWebAppSettings"] });
    },
  });
}
