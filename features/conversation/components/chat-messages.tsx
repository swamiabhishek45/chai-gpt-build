"use client";

import { isTextUIPart, isToolUIPart, getToolName, type UIMessage } from "ai";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { SearchSources } from "./search-sources";

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
};

/**
 * Renders the conversation message list with markdown responses and a loading indicator.
 */
export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
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

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent className={hasToolCalls ? "w-full max-w-212.5" : ""}>
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
            </Message>
          );
        })}

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