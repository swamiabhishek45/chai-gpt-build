import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { UIMessage } from "ai";



function toUIMessageParts(parts: Prisma.JsonValue | null, content: string): UIMessage["parts"]{

    const stored = parts as UIMessage["parts"] | null;
    if(Array.isArray(stored) && stored.length > 0){
        return stored;
    }


    return [{type: "text", text: content}];

}


export async function loadChatMessages(conversationId: string): Promise<UIMessage[]> {
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