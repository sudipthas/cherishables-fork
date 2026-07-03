import { type GalleryImage, createActor } from "@/backend";
import { loadConfig, useActor } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGalleryImages() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<GalleryImage[]>({
    queryKey: ["galleryImages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGalleryImages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveGalleryImages() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<GalleryImage[]>({
    queryKey: ["activeGalleryImages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveGalleryImages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
  });
}

export function useAddGalleryImage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      imageUrl,
    }: { title: string; imageUrl: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGalleryImage(title, imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
      queryClient.invalidateQueries({ queryKey: ["activeGalleryImages"] });
    },
  });
}

export function useUpdateGalleryImage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      displayOrder: bigint;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateGalleryImage(
        params.id,
        params.title,
        params.displayOrder,
        params.isActive,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
      queryClient.invalidateQueries({ queryKey: ["activeGalleryImages"] });
    },
  });
}

export function useDeleteGalleryImage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await actor.deleteGalleryImage(id);
      if (!ok) throw new Error("Image not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
      queryClient.invalidateQueries({ queryKey: ["activeGalleryImages"] });
    },
  });
}

export async function uploadGalleryImage(file: File): Promise<string> {
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
