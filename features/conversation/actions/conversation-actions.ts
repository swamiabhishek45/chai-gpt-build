"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ConversationListItem = {
    id: string
    title: string
    isPinned: boolean
    isArchived: boolean
    lastMessageAt: Date
    currentBranchId: string | null
    createdAt: Date
    updatedAt: Date
};

import { appCache, CACHE_TTL } from "@/lib/cache";

async function assertOwnsConversation(conversationId: string, userId: string) {
    const cacheKey = `conversation:${conversationId}`;
    const cached = appCache.get<any>(cacheKey);
    if (cached && cached.userId === userId) {
        return cached;
    }

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId
        }
    });

    if (!conversation) {
        throw new Error("Conversation not found")
    }

    appCache.set(cacheKey, conversation, CACHE_TTL.CONV_DETAIL);
    return conversation;
}

// get conversation
export async function getConversation(conversationId:string) {
    const user = await requireUser();
    return assertOwnsConversation(conversationId, user.id);
}

// list conversations
export async function listConversations(): Promise<ConversationListItem[]> {
    const user = await requireUser();
    const cacheKey = `conversations:${user.id}`;
    const cached = appCache.get<ConversationListItem[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const conversations = await prisma.conversation.findMany({
        where: { userId: user.id, isArchived: false }, //condition
        orderBy: [{ isPinned: "desc" }, { lastMessageAt: "desc" }], // sorting of data
        select: { // which data to fetch from DB
            id: true,
            title: true,
            isPinned: true,
            isArchived: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true,
            currentBranchId: true,
        }
    });

    appCache.set(cacheKey, conversations, CACHE_TTL.CONV_LIST);
    return conversations;
}

// create conversations
export async function createConversation(title = "New Chat") {
    const user = await requireUser();
    const trimmedTitle = title.trim();

    const conversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: trimmedTitle || "New Chat"
        }
    });

    appCache.delete(`conversations:${user.id}`);
    return conversation;
}

// update conversation
export async function updateConversation(conversationId: string, data: { title?: string, isPinned?: boolean, isArchived?: boolean }) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id)

    const conversaton = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            ...(data.title !== undefined ? { title: data.title.trim() || "New Chat" } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {})
        }
    });

    appCache.delete(`conversations:${user.id}`);
    appCache.delete(`conversation:${conversationId}`);

    revalidatePath("/")
    revalidatePath(`/c/${conversationId}`)

    return conversaton;
}

// delete conversation
export async function deleteConversation(conversationId: string) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id)

    await prisma.conversation.delete({
        where: { id: conversationId },
    });

    appCache.delete(`conversations:${user.id}`);
    appCache.delete(`conversation:${conversationId}`);
    appCache.deleteByPattern(`active_branch:${conversationId}`);

    revalidatePath("/")
    return { id: conversationId }
}
