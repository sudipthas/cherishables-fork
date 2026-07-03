import { type HeroVideo, type HeroVideoSettings, createActor } from "@/backend";
import { loadConfig, useActor } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type VideoPlatform = "Website" | "Mobile" | "Both";
export const encodePlatform = (p: VideoPlatform) =>
  ({ [p]: null }) as { Website: null } | { Mobile: null } | { Both: null };

/** Add a hero video tagged for a specific platform */
export function useAddHeroVideoForPlatform() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      videoUrl,
      platform,
    }: { title: string; videoUrl: string; platform: VideoPlatform }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addHeroVideo(
        title,
        videoUrl,
        encodePlatform(platform),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroVideos"] });
      queryClient.invalidateQueries({ queryKey: ["activeHeroVideos"] });
    },
  });
}

/** Full settings object — use this wherever you need any of the four fields. */
export function useHeroVideoSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<HeroVideoSettings>({
    queryKey: ["heroVideoSettings"],
    queryFn: async () => {
      if (!actor)
        return {
          keepVolumeOn: true,
          autoplay: true,
          loopEnabled: true,
          muted: false,
        };
      return actor.getHeroVideoSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/** Accepts a partial update — fetches current state first so only changed fields are overwritten. */
export function useUpdateHeroVideoSettings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<HeroVideoSettings>) => {
      if (!actor) throw new Error("Actor not available");
      const current = await actor.getHeroVideoSettings();
      return actor.setHeroVideoSettings(
        params.keepVolumeOn ?? current.keepVolumeOn,
        params.autoplay ?? current.autoplay,
        params.loopEnabled ?? current.loopEnabled,
        params.muted ?? current.muted,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroVideoSettings"] });
    },
  });
}

/** @deprecated Use useHeroVideoSettings() instead */
export function useHeroVideoVolumeSetting() {
  const { data, ...rest } = useHeroVideoSettings();
  return { data: data?.keepVolumeOn, ...rest };
}

/** @deprecated Use useUpdateHeroVideoSettings() instead */
export function useSetHeroVideoVolumeSetting() {
  return useUpdateHeroVideoSettings();
}

export function useHeroVideos() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<HeroVideo[]>({
    queryKey: ["heroVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHeroVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveHeroVideos() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<HeroVideo[]>({
    queryKey: ["activeHeroVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveHeroVideos();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000, // 5 minutes
  });
}

export function useAddHeroVideo() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      videoUrl,
    }: { title: string; videoUrl: string; platform?: VideoPlatform }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addHeroVideo(
        title,
        videoUrl,
        encodePlatform("Both"),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroVideos"] });
      queryClient.invalidateQueries({ queryKey: ["activeHeroVideos"] });
    },
  });
}

export function useUpdateHeroVideo() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      isActive: boolean;
      isDefault: boolean;
      displayOrder: bigint;
      platform?: VideoPlatform;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).updateHeroVideo(
        params.id,
        params.isActive,
        params.isDefault,
        params.displayOrder,
        encodePlatform("Both"),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroVideos"] });
      queryClient.invalidateQueries({ queryKey: ["activeHeroVideos"] });
    },
  });
}

export function useDeleteHeroVideo() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.deleteHeroVideo(id);
      if (!ok) throw new Error("Video not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroVideos"] });
      queryClient.invalidateQueries({ queryKey: ["activeHeroVideos"] });
    },
  });
}

/** @deprecated Platform filtering removed — use useActiveHeroVideos() instead. Kept for backward compat. */
export const useActiveHeroVideosByPlatform = (_platform: VideoPlatform) => {
  return useActiveHeroVideos();
};

/** Resolve the platform string from a HeroVideo's platform field (Candid variant). */
export function resolveVideoPlatform(platform: unknown): VideoPlatform {
  if (typeof platform === "string") {
    if (platform === "Website" || platform === "Mobile" || platform === "Both")
      return platform;
  }
  if (platform && typeof platform === "object") {
    const keys = Object.keys(platform as object);
    for (const k of keys) {
      const norm = k.replace(/^#/, "");
      if (norm === "Website") return "Website";
      if (norm === "Mobile") return "Mobile";
      if (norm === "Both") return "Both";
    }
  }
  return "Both";
}

export async function uploadHeroVideo(file: File): Promise<string> {
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
}
