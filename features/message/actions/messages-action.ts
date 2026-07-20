"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { MessageRole, MessageStatus } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { ensureActiveBranch } from "@/features/ai/action/chat-store";

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
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id);

    const branch = await ensureActiveBranch(conversationId);
    if (!branch.leafMessageId) {
        return [];
    }

    const allMessages = await prisma.message.findMany({
        where: { conversationId },
    });

    const messageMap = new Map(allMessages.map((m) => [m.id, m]));
    const path: typeof allMessages = [];
    
    let currentId: string | null = branch.leafMessageId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const msg = messageMap.get(currentId);
        if (!msg) break;
        path.unshift(msg);
        currentId = msg.parentId;
    }

    return path.map((row) => ({
        id: row.id,
        conversationId: row.conversationId,
        role: row.role,
        status: row.status,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }));
}

export async function createMessage(conversationId: string, content: string) {
    const user = await requireUser();
    const conversation = await assertOwnsConversation(conversationId, user.id);
    const trimmed = content.trim();

    if (!trimmed) {
        throw new Error("Message cannot be empty");
    }

    const branch = await ensureActiveBranch(conversationId);

    const message = await prisma.message.create({
        data: { 
            conversationId, 
            role: "USER", 
            status: "COMPLETE", 
            content: trimmed,
            parentId: branch.leafMessageId,
        },
    });

    await prisma.branch.update({
        where: { id: branch.id },
        data: { leafMessageId: message.id }
    });

    const shouldRename = conversation.title === "New Chat" || conversation.title.trim() === "";

    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            lastMessageAt: new Date(),
            ...(shouldRename ? { title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed } : {})
        }
    });

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
    });

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message not found");
    }

    const parentId = existing.parentId;
    await prisma.branch.updateMany({
        where: { leafMessageId: messageId },
        data: { leafMessageId: parentId }
    });

    await prisma.message.delete({
        where: { id: messageId }
    });

    revalidatePath(`/c/${existing.conversationId}`);
    return { id: messageId, conversationId: existing.conversationId };
}