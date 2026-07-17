"use client";

import { queryKeys } from "@/features/conversation/utils/query-keys";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMessage, deleteMessage, listMessages, updateMessage } from "../actions/messages-action";
import { toast } from "sonner";


export function useMessages(conversationId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.messages.byConversation(conversationId ?? "none"),
        queryFn: () => listMessages(conversationId!),
        enabled: Boolean(conversationId)
    })
}

export function useCreateMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content: string) => createMessage(conversationId, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            })

            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all,
            })

        },
        onError: (error: Error) => {
            toast.error(error.message || "could not send message")

        }
    })
}

export function useUpdateMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, content }: { id: string, content: string }) => updateMessage(id, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not update message")
        }
    })
}


export function useDeleteMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMessage(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            })
            toast.success("Message deleted")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not delete message")
        }
    })



}