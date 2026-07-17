"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";

export async function startNewChat() {
    const user = await requireUser();

    // if (!user) {
    //     throw new Error("User not found");
    // }

    // create new conversation

    const conversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: "New Chat"
        }
    })

    return conversation.id;
}