"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Ensure user owns conversation
async function assertOwnsConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

export async function listBranches(conversationId: string) {
  const user = await requireUser();
  await assertOwnsConversation(conversationId, user.id);

  return prisma.branch.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createBranch(conversationId: string, name: string, branchingMessageId: string | null) {
  const user = await requireUser();
  await assertOwnsConversation(conversationId, user.id);

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Branch name cannot be empty");
  }

  // Create the new branch
  const newBranch = await prisma.branch.create({
    data: {
      conversationId,
      name: trimmedName,
      leafMessageId: branchingMessageId,
    },
  });

  // Switch to this new branch as the active one
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { currentBranchId: newBranch.id },
  });

  revalidatePath(`/c/${conversationId}`);
  revalidatePath("/");
  return newBranch;
}

export async function switchBranch(conversationId: string, branchId: string) {
  const user = await requireUser();
  await assertOwnsConversation(conversationId, user.id);

  // Verify branch exists and belongs to this conversation
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, conversationId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { currentBranchId: branchId },
  });

  revalidatePath(`/c/${conversationId}`);
  revalidatePath("/");
  return branch;
}

export async function renameBranch(branchId: string, name: string) {
  const user = await requireUser();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Branch name cannot be empty");
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { conversation: true },
  });

  if (!branch || branch.conversation.userId !== user.id) {
    throw new Error("Branch not found");
  }

  const updated = await prisma.branch.update({
    where: { id: branchId },
    data: { name: trimmedName },
  });

  revalidatePath(`/c/${branch.conversationId}`);
  return updated;
}

export async function deleteBranch(branchId: string) {
  const user = await requireUser();
  
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { conversation: true },
  });

  if (!branch || branch.conversation.userId !== user.id) {
    throw new Error("Branch not found");
  }

  // Delete the branch
  await prisma.branch.delete({
    where: { id: branchId },
  });

  // If this was the active branch, set another one as active
  if (branch.conversation.currentBranchId === branchId) {
    const remainingBranches = await prisma.branch.findMany({
      where: { conversationId: branch.conversationId },
      orderBy: { createdAt: "asc" },
    });

    if (remainingBranches.length > 0) {
      await prisma.conversation.update({
        where: { id: branch.conversationId },
        data: { currentBranchId: remainingBranches[0].id },
      });
    } else {
      // Create a default Main branch if no branches left
      const newMain = await prisma.branch.create({
        data: {
          conversationId: branch.conversationId,
          name: "Main",
          leafMessageId: null,
        },
      });
      await prisma.conversation.update({
        where: { id: branch.conversationId },
        data: { currentBranchId: newMain.id },
      });
    }
  }

  revalidatePath(`/c/${branch.conversationId}`);
  revalidatePath("/");
  return { id: branchId, conversationId: branch.conversationId };
}
