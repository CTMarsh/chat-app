'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useChat } from '@/components/providers/chat-provider'
import { usePrivacyPreferences } from '@/components/providers/preferences-provider'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { PinnedMessagesBar } from './pinned-messages-bar'
import { LiveRegion } from '@/components/ui/live-region'

export function MessageList() {
  const { messages, activeConversation, currentUser, typingUsers, pinnedMessages, unpinMessage } = useChat()
  const { showTypingIndicator } = usePrivacyPreferences()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [newMessageAnnouncement, setNewMessageAnnouncement] = useState('')
  const prevMessageCountRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

    // Announce new messages for screen readers
    if (messages.length > prevMessageCountRef.current) {
      const newMessage = messages[messages.length - 1]
      if (newMessage && newMessage.sender_id !== currentUser?.id) {
        const senderName = newMessage.sender?.display_name || newMessage.sender?.username || 'Someone'
        const preview = newMessage.content?.slice(0, 50) || 'sent a file'
        setNewMessageAnnouncement(`New message from ${senderName}: ${preview}`)
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages, currentUser?.id])

  const typingInConversation = activeConversation
    ? typingUsers.get(activeConversation.id) || []
    : []

  // Get typing user names
  const typingUserNames = typingInConversation
    .map(userId => {
      const participant = activeConversation?.participants.find(
        p => p.user_id === userId
      )
      return participant?.profile.display_name || participant?.profile.username
    })
    .filter(Boolean) as string[]

  // Scroll to a specific message
  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight the message briefly
      element.classList.add('bg-primary/10')
      setTimeout(() => {
        element.classList.remove('bg-primary/10')
      }, 2000)
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LiveRegion message={newMessageAnnouncement} mode="polite" clearAfter={3000} />
      <PinnedMessagesBar
        messages={pinnedMessages}
        onMessageClick={scrollToMessage}
        onUnpin={unpinMessage}
      />
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4" role="log" aria-label="Messages" aria-live="off">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-foreground">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start the conversation!</p>
          </div>
        ) : (
          <ol className="space-y-4 list-none" aria-label="Message list">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showAvatar =
                !previousMessage || previousMessage.sender_id !== message.sender_id

              // For widget conversations, visitor messages have visitor_name set
              // even though sender_id might be the workspace owner (for FK constraint)
              // So we check: it's "own" only if sender_id matches AND it's not a visitor message
              const isFromVisitor = !!message.visitor_name
              const isOwn = message.sender_id === currentUser?.id && !isFromVisitor

              return (
                <li key={message.id} id={`message-${message.id}`} className="transition-colors duration-500">
                  <MessageItem
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                  />
                </li>
              )
            })}
          </ol>
        )}

        {showTypingIndicator && typingUserNames.length > 0 && (
          <TypingIndicator userNames={typingUserNames} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
