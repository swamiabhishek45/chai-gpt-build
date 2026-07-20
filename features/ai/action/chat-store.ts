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


export async function loadChatMessages(conversationId: string): Promise<UIMessage[]> {

  // it returns an array of stored messages from the database in ascending order
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" }
  })

  return rows.map((row) => ({
    id: row.id,
    role: row.role === "ASSISTANT" ? "assistant" : "user",
    parts: toUIMessageParts(row.parts, row.content),
  }));
}

export async function saveChatMessages(
  conversationId: string,
  messages: UIMessage[],
  options: SaveChatMessagesOptions = {}
) {
  const { updateTitle = true } = options;

  for (const message of messages) {
    if (message.role === "system") continue;

    const content = getMessageText(message);
    const role = message.role === "assistant" ? "ASSISTANT" : "USER";

    await prisma.message.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        conversationId,
        role,
        status: "COMPLETE",
        content,
        parts: message.parts as Prisma.InputJsonValue,
      },
      update: {
        content,
        parts: message.parts as Prisma.InputJsonValue,
        status: "COMPLETE",
      },
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