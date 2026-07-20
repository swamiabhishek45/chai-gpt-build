import { onBoard } from "@/features/auth/actions/onboard";
import { ChatShell } from "@/features/conversation/components/chat-shell";
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db";
import React from 'react';

const RootGroupLayout = async ({ children }: { children: React.ReactNode }) => {
    const { userId } = await auth.protect();

    // Fast local DB check to see if user is already onboarded
    const userExists = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true }
    });

    if (!userExists) {
        await onBoard();
    }

    return (
        <ChatShell>
            {children}
        </ChatShell>
    )
}

export default RootGroupLayout;