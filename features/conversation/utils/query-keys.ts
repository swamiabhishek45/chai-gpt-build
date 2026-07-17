export const queryKeys = {
    conversation: {
        all: ['conversations'] as const,
        detail: (id: string) => ['conversations', id] as const,
    },
    messages: {
        byConversation: (conversationId: string) => ["messages", conversationId] as const
    }
}