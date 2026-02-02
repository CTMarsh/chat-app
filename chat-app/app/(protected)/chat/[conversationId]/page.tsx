'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useChat } from '@/components/providers/chat-provider'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const { conversations, setActiveConversation, activeConversation } = useChat()

  useEffect(() => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setActiveConversation(conversation)
    }

    return () => {
      setActiveConversation(null)
    }
  }, [conversationId, conversations, setActiveConversation])

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  )
}
