import { loadChatMessages } from "@/features/ai/action/chat-store";
import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";


import { type UIMessage } from "ai"

export async function POST(req: Request) {
    await auth.protect();

    // id = conversationId

    const { message, id }: { message: UIMessage, id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversatin id", { status: 400 })
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    })

    if(!conversation){
        return new Response("Conversation not found", {status: 404})
    }

    const previousMessages = await loadChatMessages(id)

    const alreadySaved = previousMessages.some((storedMessage) => storedMessage.id === message.id)

    const messages = alreadySaved ? previousMessages : [...previousMessages, message]

    if(!alreadySaved){
        await saveChatMessage(id, [message]);
    }

}