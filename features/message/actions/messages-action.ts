"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { MessageRole, MessageStatus } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export type MessageListItem = {
    id: string
    conversationId: string
    role: MessageRole
    status: MessageStatus
    content: string
    createdAt: Date
    updatedAt: Date
}

// fetching own conversations
async function assertOwnsConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId
        }
    })

    if (!conversation) {
        throw new Error("Conversation not found")
    }

    return conversation;

}

export async function listMessages(conversationId: string): Promise<MessageListItem[]> {

    // authenticate the user
    const user = await requireUser();

    // is conversationId matching with this
    await assertOwnsConversation(conversationId, user.id)

    return prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            conversationId: true,
            role: true,
            status: true,
            content: true,
            createdAt: true,
            updatedAt: true,
        }
    })
}

export async function createMessage(conversationId: string, content: string) {

    const user = await requireUser();

    const conversation = await assertOwnsConversation(conversationId, user.id)

    const trimmed = content.trim();

    if (!trimmed) {
        throw new Error("Message cannot be empty")
    }

    const message = await prisma.message.create({
        data: { conversationId, role: "USER", status: "COMPLETE", content: trimmed },

    })

    const shouldRename = conversation.title === "New Chat" || conversation.title.trim() === "";

    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            lastMessageAt: new Date(),
            ...(shouldRename ? { title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed } : {})
        }
    })

    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);
    return message;

}

export async function updateMessage(messageId: string, content: string) {
    const user = await requireUser();
    const trimmed = content.trim();

    if (!trimmed) {
        throw new Error("Message cannot be empty")
    }

    const existing = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true }
    })

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message not found")
    }

    const message = await prisma.message.update({
        where: { id: messageId },
        data: { content: trimmed }
    })

    revalidatePath(`/c${existing.conversationId}`)
}


export async function deleteMessage(messageId: string) {
    const user = await requireUser();

    const existing = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true }
    })

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message not found")
    }

    await prisma.message.delete({
        where: { id: messageId }
    })

    revalidatePath(`/c${existing.conversationId}`)
    return { id: messageId, conversationId: existing.conversationId }

}