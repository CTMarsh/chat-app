'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useChat } from '@/components/providers/chat-provider'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { PinnedMessagesBar } from './pinned-messages-bar'

export function MessageList() {
  const { messages, activeConversation, currentUser, typingUsers, pinnedMessages, unpinMessage } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <PinnedMessagesBar
        messages={pinnedMessages}
        onMessageClick={scrollToMessage}
        onUnpin={unpinMessage}
      />
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showAvatar =
                !previousMessage || previousMessage.sender_id !== message.sender_id

              return (
                <div key={message.id} id={`message-${message.id}`} className="transition-colors duration-500">
                  <MessageItem
                    message={message}
                    isOwn={message.sender_id === currentUser?.id}
                    showAvatar={showAvatar}
                  />
                </div>
              )
            })}
          </div>
        )}

        {typingUserNames.length > 0 && (
          <TypingIndicator userNames={typingUserNames} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
