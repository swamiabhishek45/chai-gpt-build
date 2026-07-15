"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";

export type ConversationListItem = {
    id :String
    title: String
    isPinned: Boolean
    isArchived: Boolean
    lastMessageAt: Date
    createdAt: Date
    updatedAt: Date
};

export async function listConversations() {

    const user = await requireUser();


    
}