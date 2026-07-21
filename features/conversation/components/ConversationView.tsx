"use client";

import React, { useMemo } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { useConversations } from "../hooks/use-conversation";

import { useChat } from '@ai-sdk/react'
import { queryKeys } from "../utils/query-keys";
import { toast } from "sonner";
import { ChatEmpty } from "./chat-empty";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { BranchSelector } from "./branch-selector";

type ConversationViewProps = {
  conversationId: string;
  initialMessages: UIMessage[];
};

const ConversationView = ({
  conversationId,
  initialMessages,
}: ConversationViewProps) => {

  const queryClient = useQueryClient();
  const { data: conversations } = useConversations();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            message: messages.at(-1),
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation.all,
      });
      void queryClient.invalidateQueries({
        queryKey: ["user", "usage"],
      });
    },
    onError: (error) => {
      toast.error(error.message);
      void queryClient.invalidateQueries({
        queryKey: ["user", "usage"],
      });
    },
  });
  const conversation = conversations?.find((item) => item.id === conversationId);
  const title = conversation?.title ?? "Chat";
  const currentBranchId = conversation?.currentBranchId ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <h1 className="truncate text-sm font-medium max-w-[120px] min-[400px]:max-w-[200px] sm:max-w-[400px]">{title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BranchSelector conversationId={conversationId} currentBranchId={currentBranchId} />
        </div>
      </header>

      {messages.length === 0 ? (
        <ChatEmpty
          onSend={(text) => {
            void sendMessage({ text });
          }}
        />
      ) : (
        <ChatMessages messages={messages} status={status} conversationId={conversationId} />
      )}

      <ChatComposer
        onSend={(text) => {
          void sendMessage({ text });
        }}
        isSending={status !== "ready"}
        autoFocus
      />
    </div>
  );
};

export default ConversationView;
