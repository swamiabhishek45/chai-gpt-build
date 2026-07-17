import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{id: string}>
}

const page = async({params}: ConversationPageProps) => {

    const {id} = await params;

    try {
        await getConversation(id);
    } catch (error) {
        notFound();
    }

    // const initalMessages = await loadChatMessages(id);
  return (
    <div>page {id}</div>
  )
}

export default page;