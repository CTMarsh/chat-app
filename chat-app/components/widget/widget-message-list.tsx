'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { User } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  type: string
  isFromVisitor: boolean
  visitorName?: string
  visitorEmail?: string
  sender?: {
    id: string
    displayName: string
    avatarUrl: string
  }
}

interface WidgetMessageListProps {
  messages: Message[]
  primaryColor: string
}

export function WidgetMessageList({ messages, primaryColor }: WidgetMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null
        const showTail = !prevMessage || prevMessage.isFromVisitor !== message.isFromVisitor

        return (
          <div
            key={message.id}
            className={`flex ${message.isFromVisitor ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-end gap-2 max-w-[85%] ${
                message.isFromVisitor ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar for agent messages */}
              {!message.isFromVisitor && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {message.sender?.avatarUrl ? (
                    <img
                      src={message.sender.avatarUrl}
                      alt={message.sender.displayName || 'Agent'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              )}

              <div
                className={`relative rounded-2xl px-3.5 py-2 ${
                  message.isFromVisitor
                    ? `text-white ${showTail ? 'rounded-br-[4px]' : 'rounded-br-md'}`
                    : `bg-gray-100 text-gray-800 ${showTail ? 'rounded-bl-[4px]' : 'rounded-bl-md'}`
                }`}
                style={message.isFromVisitor ? { backgroundColor: primaryColor } : undefined}
              >
                {/* Sail-shaped bubble tail */}
                {showTail && (
                  <svg
                    className={`absolute bottom-0 h-[10px] w-[7px] ${
                      message.isFromVisitor ? '-right-[6px]' : '-left-[6px]'
                    }`}
                    viewBox="0 0 7 10"
                    fill="none"
                  >
                    <path
                      d={message.isFromVisitor ? 'M0 0V10Q3.5 10 7 0Z' : 'M7 0V10Q3.5 10 0 0Z'}
                      fill={message.isFromVisitor ? primaryColor : '#f3f4f6'}
                    />
                  </svg>
                )}

                {/* Agent name for agent messages */}
                {!message.isFromVisitor && message.sender?.displayName && (
                  <p className="text-xs font-medium text-gray-600 mb-0.5">
                    {message.sender.displayName}
                  </p>
                )}

                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                <p
                  className={`text-[10px] mt-1 ${
                    message.isFromVisitor ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatMessageTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return format(date, 'h:mm a')
    }

    return format(date, 'MMM d, h:mm a')
  } catch {
    return ''
  }
}
