'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from './chat-provider'
import { useNotifications } from '@/lib/hooks/use-notifications'

/**
 * NotificationHandler - Watches for new messages and sends notifications
 *
 * This component should be rendered inside both ChatProvider and PreferencesProvider.
 * It monitors messages and notifications from chat context and triggers
 * desktop/sound notifications based on user preferences.
 */
export function NotificationHandler() {
  const router = useRouter()
  const { messages, activeConversation, currentUser, conversations } = useChat()
  const { notify, requestPermission } = useNotifications()

  // Track which messages we've already notified about
  const notifiedMessagesRef = useRef<Set<string>>(new Set())
  const lastMessageCountRef = useRef<number>(0)

  // Request notification permission on mount
  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  // Watch for new messages and send notifications
  useEffect(() => {
    // Skip if no messages or no current user
    if (!messages.length || !currentUser) {
      lastMessageCountRef.current = messages.length
      return
    }

    // Only process if we have more messages than before (new messages)
    if (messages.length <= lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length
      return
    }

    // Get the newest messages (since last count)
    const newMessages = messages.slice(lastMessageCountRef.current)
    lastMessageCountRef.current = messages.length

    // Filter to messages from other users that we haven't notified about
    const messagesToNotify = newMessages.filter(
      m => m.sender_id !== currentUser.id && !notifiedMessagesRef.current.has(m.id)
    )

    // Send notifications for each new message
    messagesToNotify.forEach(message => {
      notifiedMessagesRef.current.add(message.id)

      const senderName = message.sender?.display_name || message.sender?.username || 'Someone'
      const messagePreview = message.content?.slice(0, 50) || 'Sent an attachment'

      // Find the conversation for this message
      const conversation = conversations.find(c => c.id === message.conversation_id)
      const conversationName = conversation?.type === 'group'
        ? conversation.name
        : senderName

      notify({
        title: conversationName || senderName,
        body: conversation?.type === 'group'
          ? `${senderName}: ${messagePreview}`
          : messagePreview,
        tag: `message-${message.conversation_id}`,
        onClick: () => {
          router.push(`/chat/${message.conversation_id}`)
        },
      })
    })
  }, [messages, currentUser, conversations, notify, router])

  // Clear notified messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      // Clear notifications for this conversation since we're viewing it
      notifiedMessagesRef.current.clear()
    }
  }, [activeConversation?.id])

  return null
}
