"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "../utils/query-keys";
import { createBranch, deleteBranch, listBranches, renameBranch, switchBranch } from "../actions/branch-actions";

export function useBranches(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.branches.byConversation(conversationId),
    queryFn: () => listBranches(conversationId),
    enabled: !!conversationId,
  });
}

export function useCreateBranch(conversationId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ name, branchingMessageId }: { name: string; branchingMessageId: string | null }) =>
      createBranch(conversationId, name, branchingMessageId),
    onSuccess: (newBranch) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.detail(conversationId),
      });
      toast.success(`Created branch "${newBranch.name}"`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create branch");
    },
  });
}

export function useSwitchBranch(conversationId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (branchId: string) => switchBranch(conversationId, branchId),
    onSuccess: (branch) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.detail(conversationId),
      });
      toast.success(`Switched to branch "${branch.name}"`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to switch branch");
    },
  });
}

export function useRenameBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ branchId, name }: { branchId: string; name: string }) => renameBranch(branchId, name),
    onSuccess: (branch) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
      toast.success(`Renamed branch to "${branch.name}"`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to rename branch");
    },
  });
}

export function useDeleteBranch(conversationId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (branchId: string) => deleteBranch(branchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.detail(conversationId),
      });
      toast.success("Branch deleted");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete branch");
    },
  });
}
