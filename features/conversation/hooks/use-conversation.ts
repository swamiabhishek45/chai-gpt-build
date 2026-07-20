"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "../utils/query-keys";
import { createConversation, deleteConversation, listConversations, updateConversation } from "../actions/conversation-actions";


export function useConversations() {
    return useQuery({
        queryKey: queryKeys.conversation.all,
        queryFn: () => listConversations(),
    })
}

export function useCreateConversation() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (title?: string) => createConversation(title),
        onSuccess: (conversation) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            })
            router.push(`/c/${conversation.id}`)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create chat")
        }
    })
}

export function useUpdateConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            title?: string;
            isPinned?: boolean;
            isArchived?: boolean;
        }) => updateConversation(id, data),

        onMutate: async ({ id, ...data }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.conversation.all });

            const previousConversations = queryClient.getQueryData(queryKeys.conversation.all);

            queryClient.setQueryData(queryKeys.conversation.all, (old: any) => {
                if (!old) return old;
                // Map over list and apply changes immediately to memory
                return old.map((conv: any) => {
                    if (conv.id === id) {
                        return { ...conv, ...data };
                    }
                    return conv;
                });
            });

            return { previousConversations };
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousConversations) {
                queryClient.setQueryData(queryKeys.conversation.all, context.previousConversations);
            }
            toast.error(error.message || "Failed to update chat");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });
        }
    })
}

export function useDeleteConversation(activeId?: string) {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (id: string) => deleteConversation(id),

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.conversation.all });

            const previousConversations = queryClient.getQueryData(queryKeys.conversation.all);

            queryClient.setQueryData(queryKeys.conversation.all, (old: any) => {
                if (!old) return old;
                // Filter out the deleted chat instantly
                return old.filter((conv: any) => conv.id !== id);
            });

            return { previousConversations };
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousConversations) {
                queryClient.setQueryData(queryKeys.conversation.all, context.previousConversations);
            }
            toast.error(error.message || "Failed to delete chat");
        },
        onSuccess: ({ id }) => {
            if (activeId === id) {
                router.push("/")
            }
            toast.success("Chat deleted");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });
        }
    })
}