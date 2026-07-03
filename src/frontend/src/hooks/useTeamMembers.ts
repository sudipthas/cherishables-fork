import { createActor } from "@/backend";
import { loadConfig, useActor } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  displayOrder: bigint;
  isActive: boolean;
  uploadedAt: bigint;
}

export function useTeamMembers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      if (!actor) return [];
      const backendActor = actor as unknown as {
        getTeamMembers: () => Promise<Array<TeamMember>>;
      };
      return backendActor.getTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveTeamMembers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TeamMember[]>({
    queryKey: ["activeTeamMembers"],
    queryFn: async () => {
      if (!actor) return [];
      const backendActor = actor as unknown as {
        getActiveTeamMembers: () => Promise<Array<TeamMember>>;
      };
      return backendActor.getActiveTeamMembers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
  });
}

export function useAddTeamMember() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      role,
      imageUrl,
    }: {
      name: string;
      role: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        addTeamMember: (
          name: string,
          role: string,
          imageUrl: string,
        ) => Promise<TeamMember>;
      };
      return backendActor.addTeamMember(name, role, imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["activeTeamMembers"] });
    },
  });
}

export function useUpdateTeamMember() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      role: string;
      imageUrl: string;
      displayOrder: bigint;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        updateTeamMember: (
          id: string,
          name: string,
          role: string,
          imageUrl: string,
          displayOrder: bigint,
          isActive: boolean,
        ) => Promise<TeamMember | null>;
      };
      return backendActor.updateTeamMember(
        params.id,
        params.name,
        params.role,
        params.imageUrl,
        params.displayOrder,
        params.isActive,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["activeTeamMembers"] });
    },
  });
}

export function useDeleteTeamMember() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        deleteTeamMember: (id: string) => Promise<boolean>;
      };
      const ok = await backendActor.deleteTeamMember(id);
      if (!ok) throw new Error("Team member not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["activeTeamMembers"] });
    },
  });
}

export function useReorderTeamMembers() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!actor) throw new Error("Actor not available");
      const backendActor = actor as unknown as {
        reorderTeamMembers: (ids: string[]) => Promise<void>;
      };
      return backendActor.reorderTeamMembers(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["activeTeamMembers"] });
    },
  });
}

export async function uploadTeamMemberImage(file: File): Promise<string> {
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
