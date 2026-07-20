import { loadChatMessages } from '@/features/ai/action/chat-store';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import ConversationView from '@/features/conversation/components/ConversationView';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{id: string}>
}

const page = async({params}: ConversationPageProps) => {

    const {id} = await params;

    let conversation;
    try {
        conversation = await getConversation(id);
    } catch (error) {
        notFound();
    }

    const initialMessages = await loadChatMessages(id);
  return (
    <ConversationView
      key={`${id}-${conversation.currentBranchId || 'default'}`}
      conversationId={id}
      initialMessages={initialMessages}
    />
  )
}

export default page;