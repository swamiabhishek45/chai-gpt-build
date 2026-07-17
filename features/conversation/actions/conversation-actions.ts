"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ConversationListItem = {
    id: String
    title: String
    isPinned: Boolean
    isArchived: Boolean
    lastMessageAt: Date
    createdAt: Date
    updatedAt: Date
};

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

// get conversation
export async function getConversation(conversationId:string) {
    const user = await requireUser();
    return assertOwnsConversation(conversationId, user.id);
}

// list conversations
export async function listConversations(): Promise<ConversationListItem[]> {

    const user = await requireUser();

    return prisma.conversation.findMany({
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
        }
    })
}

// craete conversations
export async function createConversation(title = "New Chat") {

    const user = await requireUser();

    const trimmedTitle = title.trim();

    return prisma.conversation.create({
        data: {
            userId: user.id,
            title: trimmedTitle || "New Chat"
        }
    })
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
    })

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
    })

    revalidatePath("/")
    return { id: conversationId }

}
