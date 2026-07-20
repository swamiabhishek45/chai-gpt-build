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

        onSuccess: (conversation) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update chat")
        }
    })
}

export function useDeleteConversation(activeId?: string) {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (id: string) => deleteConversation(id),
        onSuccess: ({ id }) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });
            if (activeId === id) {
                router.push("/")
            }

            toast.success("Chat deleted");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to deleted chat")
        }


    })
}