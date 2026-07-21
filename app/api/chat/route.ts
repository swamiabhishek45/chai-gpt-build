import { loadChatMessages, saveChatMessages } from "@/features/ai/action/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { appCache } from "@/lib/cache";
import { Logger } from "@/lib/logger";

import { convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, streamText, toUIMessageStream, tool, isStepCount, zodSchema, type UIMessage } from "ai"
import { z } from "zod";
import { searchTavily } from "@/features/ai/utils/search";

// 1. Request received
export async function POST(req: Request) {

    // 2. Authentication: Without login you are not allowed to access this api
    await auth.protect();

    // 3. Parse and validate input: id means conversationId
    const { message, id }: { message: UIMessage, id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversatin id", { status: 400 })
    }

    // 4. Get current user
    const user = await requireUser();

    if (!user) {
        return new Response("user not found", { status: 404 });
    }

    // 5. Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    })

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 })
    }

    // Rate Limiting Check & Increment (Backend enforced and atomic/concurrency-safe)
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { apiCallsCount: { increment: 1 } }
    });

    if (updatedUser.apiCallsCount > 10) {
        // Exceeded limit: revert the increment
        await prisma.user.update({
            where: { id: user.id },
            data: { apiCallsCount: { decrement: 1 } }
        });

        // Invalidate the cache to ensure requireUser() or other components get the updated count
        appCache.delete(`user:${user.clerkId}`);

        return new Response("API call limit reached. You have used all 10 allowed requests.", {
            status: 429,
            statusText: "Too Many Requests"
        });
    }

    // Invalidate the cache for user's updated calls count
    appCache.delete(`user:${user.clerkId}`);

    // 6. Load previous messages (instrumented)
    const previousMessages = await Logger.measure(
        "Load Previous Messages",
        () => loadChatMessages(id),
        { conversationId: id, userId: user.id }
    );

    // 7. Check and save new messages
    const alreadySaved = previousMessages.some((storedMessage) => storedMessage.id === message.id)

    const messages = alreadySaved ? previousMessages : [...previousMessages, message]

    if (!alreadySaved) {
        await Logger.measure(
            "Save Incoming User Message",
            () => saveChatMessages(id, [message]),
            { conversationId: id, userId: user.id }
        );
    }

    // 8. Prepare AI stream
    const result = streamText({
        model: getChatModel(),
        system: conversation.systemPrompt || "you are a chatgpt, useful assistant",
        messages: await convertToModelMessages(messages),
        stopWhen: isStepCount(5),
        tools: {
            webSearch: tool({
                description: "Search the web for real-time information, current news, facts, and queries requiring external or up-to-date knowledge.",
                inputSchema: zodSchema(z.object({
                    query: z.string().describe("The search query to run on the web. Keep it focused and descriptive."),
                })),
                execute: async ({ query }) => {
                    try {
                        const results = await Logger.measure(
                            `Search Tavily: ${query.slice(0, 30)}`,
                            () => searchTavily(query),
                            { query }
                        );
                        return results;
                    } catch (error) {
                        Logger.error("Tavily search failed", error as Error, { query });
                        return {
                            error: true,
                            message: error instanceof Error ? error.message : "Unknown search error",
                            results: []
                        };
                    }
                }
            })
        }
    })

    // 9. start streaming and bg save
    result.consumeStream();

    // 10. Run UI to client
    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
            stream: result.stream,
            originalMessages: messages,
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),

            // On stream end -> final save (instrumented in background)
            onEnd: async ({ messages: finalMessages }) => {
                try {
                    await Logger.measure(
                        "Save Stream End Messages",
                        () => saveChatMessages(id, finalMessages, { updateTitle: false }),
                        { conversationId: id }
                    );
                } catch (error) {
                    Logger.error("Failed to save chat messages on stream end", error as Error, { conversationId: id });
                }
            }
        })
    })

}