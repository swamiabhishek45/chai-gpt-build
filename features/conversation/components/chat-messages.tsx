"use client";

import React, { useState } from "react";
import { isTextUIPart, isToolUIPart, getToolName, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { GitBranch, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { SearchSources } from "./search-sources";
import { useCreateBranch } from "../hooks/use-branches";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
  conversationId: string;
};

/**
 * Renders the conversation message list with markdown responses and a loading indicator.
 */
export function ChatMessages({ messages, status, conversationId }: ChatMessagesProps) {
  const [forkingMessageId, setForkingMessageId] = useState<string | null>(null);
  const [forkName, setForkName] = useState("");

  const createBranchMutation = useCreateBranch(conversationId);

  const handleForkSubmit = async () => {
    if (!forkName.trim() || !forkingMessageId) return;
    try {
      await createBranchMutation.mutateAsync({
        name: forkName.trim(),
        branchingMessageId: forkingMessageId,
      });
      setForkingMessageId(null);
      setForkName("");
    } catch {
      // Handled in toast
    }
  };

  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation className="flex justify-center w-full min-h-0 flex-1">
      <ConversationContent className="py-10 px-4 w-full max-w-4xl mx-auto flex flex-col gap-10">
        {messages.map((message, idx) => {
          // Find all webSearch tool parts in this message using AI SDK helpers
          const webSearchParts =
            message.parts?.filter(
              (part) => isToolUIPart(part) && getToolName(part) === "webSearch"
            ) || [];

          // Skip rendering system messages as separate bubbles
          if (message.role === "system") return null;

          const textContent = getMessageText(message);
          const hasToolCalls = webSearchParts.length > 0;
          const hasTextContent = textContent.trim().length > 0;

          const isLastMessage = idx === messages.length - 1;
          const isGenerating = isLastMessage && status === "streaming" && message.role === "assistant";

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex flex-col items-center"
            >
              <Message from={message.role} className="w-full">
                <MessageContent className={cn(
                  hasToolCalls ? "w-full" : "",
                  isGenerating && "after:content-['▋'] after:inline-block after:text-primary after:ml-0.5 after:animate-pulse"
                )}>
                {/* 1. Render Search Tool execution state and results if any */}
                {hasToolCalls && (
                  <div className="flex flex-col gap-2 mb-3">
                    {webSearchParts.map((part: any, partIdx) => {
                      const query = part.input?.query || "";
                      const isCompleted = part.state === "output-available";
                      const isError = part.state === "output-error";
                      const resultData = isError 
                        ? { error: true, message: part.errorText || "Search execution failed" }
                        : part.output;

                      return (
                        <SearchSources
                          key={part.toolCallId || partIdx}
                          query={query}
                          isCompleted={isCompleted}
                          result={resultData}
                        />
                      );
                    })}
                  </div>
                )}

                {/* 2. Render Text response if any */}
                {hasTextContent ? (
                  <MessageResponse>{textContent}</MessageResponse>
                ) : (
                  // Show status indicator if tool search is in progress
                  hasToolCalls && !webSearchParts.every((part: any) => part.state === "output-available" || part.state === "output-error") && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mt-1">
                      <span>Searching the web...</span>
                    </div>
                  )
                )}
              </MessageContent>

              {/* Message Fork Action Button */}
              <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex gap-1 justify-start">
                <MessageAction
                  onClick={() => {
                    setForkingMessageId(message.id);
                    setForkName(`Branch from ${message.role === "user" ? "User" : "AI"}`);
                  }}
                  tooltip="Fork a new branch from this message"
                  aria-label="Fork Branch"
                  className="h-6 px-2 text-[10px] flex items-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 rounded-md bg-background/50 cursor-pointer"
                >
                  <GitBranch size={10} className="text-primary" />
                  <span>Fork</span>
                </MessageAction>
              </MessageActions>
            </Message>
          </motion.div>
          );
        })}

        {/* Fork Dialog Modal */}
        {forkingMessageId && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setForkingMessageId(null)}>
            <div className="bg-popover border border-border rounded-xl shadow-lg w-full max-w-sm p-4 flex flex-col gap-3 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GitBranch size={14} className="text-primary" />
                  Fork Branch
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Create a new branch starting from this message.
                </p>
              </div>
              <input
                type="text"
                placeholder="Branch name (e.g. Alternative Ideas)"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && forkName.trim()) {
                    handleForkSubmit();
                  }
                }}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setForkingMessageId(null);
                    setForkName("");
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForkSubmit}
                  disabled={!forkName.trim() || createBranchMutation.isPending}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {createBranchMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                  Fork
                </button>
              </div>
            </div>
          </div>
        )}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>

    </Conversation>
  );
}