'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useChat } from '@/components/providers/chat-provider'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const { conversations, setActiveConversation, activeConversation, fetchConversationById } = useChat()
  const [isLoading, setIsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadConversation = async () => {
      // First try to find in existing conversations
      const existing = conversations.find(c => c.id === conversationId)
      if (existing) {
        setActiveConversation(existing)
        setIsLoading(false)
        setNotFound(false)
        return
      }

      // If not found and not already loading, fetch directly
      if (!isLoading && !activeConversation) {
        setIsLoading(true)
        const fetched = await fetchConversationById(conversationId)
        if (mounted) {
          if (fetched) {
            setActiveConversation(fetched)
            setNotFound(false)
          } else {
            setNotFound(true)
          }
          setIsLoading(false)
        }
      }
    }

    loadConversation()

    return () => {
      mounted = false
      setActiveConversation(null)
    }
  }, [conversationId, conversations, setActiveConversation, fetchConversationById, isLoading, activeConversation])

  if (notFound) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Conversation not found</div>
      </div>
    )
  }

  if (isLoading || !activeConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
