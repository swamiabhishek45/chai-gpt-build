"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { isTextUIPart, type UIMessage } from "ai";


type SaveChatMessagesOptions = {
  updateTitle?: boolean;
};

/** Extracts plain text from an AI SDK `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts.filter(isTextUIPart).map((part) => part.text).join("");
}


function toUIMessageParts(parts: Prisma.JsonValue | null, content: string): UIMessage["parts"] {

  const stored = parts as UIMessage["parts"] | null;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  return [{ type: "text", text: content }];
}


export async function ensureActiveBranch(conversationId: string): Promise<{ id: string; leafMessageId: string | null; name: string }> {
  let conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { currentBranchId: true }
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  let activeBranchId = conversation.currentBranchId;
  let activeBranch = activeBranchId 
    ? await prisma.branch.findUnique({ where: { id: activeBranchId } }) 
    : null;

  if (activeBranch) {
    return activeBranch;
  }

  // Active branch not resolved. Try to find any branch.
  const existingBranch = await prisma.branch.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "asc" }
  });

  if (existingBranch) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { currentBranchId: existingBranch.id }
    });
    return existingBranch;
  }

  // No branches exist. Let's inspect messages.
  const allMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" }
  });

  let leafMessageId: string | null = null;

  if (allMessages.length > 0) {
    // Legacy conversation: link them linearly
    for (let i = 1; i < allMessages.length; i++) {
      await prisma.message.update({
        where: { id: allMessages[i].id },
        data: { parentId: allMessages[i - 1].id }
      });
    }
    leafMessageId = allMessages[allMessages.length - 1].id;
  }

  // Create default Main branch
  const mainBranch = await prisma.branch.create({
    data: {
      conversationId,
      name: "Main",
      leafMessageId
    }
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { currentBranchId: mainBranch.id }
  });

  return mainBranch;
}

export async function loadChatMessages(conversationId: string): Promise<UIMessage[]> {
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
    role:
      row.role === "ASSISTANT"
        ? "assistant"
        : row.role === "SYSTEM"
        ? "system"
        : "user",
    parts: toUIMessageParts(row.parts, row.content),
  }));
}

export async function saveChatMessages(
  conversationId: string,
  messages: UIMessage[],
  options: SaveChatMessagesOptions = {}
) {
  const { updateTitle = true } = options;
  const branch = await ensureActiveBranch(conversationId);

  let prevMessageId: string | null = null;

  for (const message of messages) {
    if (message.role === "system") continue;

    const content = getMessageText(message);
    const role = message.role === "assistant" ? "ASSISTANT" : "USER";

    let parentId: string | null = null;
    if (prevMessageId) {
      parentId = prevMessageId;
    } else {
      const existing = await prisma.message.findUnique({
        where: { id: message.id },
        select: { parentId: true }
      });
      if (existing) {
        parentId = existing.parentId;
      } else {
        parentId = branch.leafMessageId;
      }
    }

    const saved: any = await prisma.message.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        conversationId,
        role,
        status: "COMPLETE",
        content,
        parts: message.parts as Prisma.InputJsonValue,
        parentId,
      },
      update: {
        content,
        parts: message.parts as Prisma.InputJsonValue,
        status: "COMPLETE",
      },
    });

    prevMessageId = saved.id;
  }

  if (prevMessageId) {
    await prisma.branch.update({
      where: { id: branch.id },
      data: { leafMessageId: prevMessageId },
    });
  }

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    select: { title: true },
  });

  const firstUser = messages.find((message) => message.role === "user");
  const firstUserText = firstUser ? getMessageText(firstUser).trim() : "";

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      title:
        updateTitle && conversation.title === "New Chat" && firstUserText
          ? firstUserText.slice(0, 48)
          : conversation.title,
    },
  });
}