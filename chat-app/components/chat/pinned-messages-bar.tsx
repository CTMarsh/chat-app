'use client'

import { useState } from 'react'
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { MessageWithSender } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface PinnedMessagesBarProps {
  messages: MessageWithSender[]
  onMessageClick: (messageId: string) => void
  onUnpin: (messageId: string) => void
}

export function PinnedMessagesBar({ messages, onMessageClick, onUnpin }: PinnedMessagesBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (messages.length === 0) return null

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const currentMessage = messages[currentIndex]

  const navigatePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : messages.length - 1))
  }

  const navigateNext = () => {
    setCurrentIndex(prev => (prev < messages.length - 1 ? prev + 1 : 0))
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2 border-b border-primary/10 bg-primary/5 px-4 py-2 backdrop-blur-sm">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Pin className="h-3.5 w-3.5 text-primary" />
        </div>
        <button
          onClick={() => onMessageClick(currentMessage.id)}
          className="flex-1 truncate text-left text-sm hover:underline"
        >
          <span className="font-medium">
            {currentMessage.sender.display_name || currentMessage.sender.username}:
          </span>{' '}
          <span className="text-muted-foreground">{currentMessage.content}</span>
        </button>
        {messages.length > 1 && (
          <div className="flex items-center gap-1" role="group" aria-label="Navigate pinned messages">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={navigatePrev} aria-label="Previous pinned message">
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {currentIndex + 1}/{messages.length}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={navigateNext} aria-label="Next pinned message">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setExpanded(true)}
        >
          View all
        </Button>
      </div>
    )
  }

  return (
    <div className="border-b border-primary/10 bg-primary/5 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Pin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Pinned Messages ({messages.length})</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(false)}
          aria-label="Collapse pinned messages"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="max-h-48 overflow-auto px-4 pb-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="mb-2 flex items-start gap-2 rounded-lg bg-background/80 p-2 shadow-sm transition-all duration-200 hover:bg-background hover:shadow-md last:mb-0"
          >
            <Avatar className="h-6 w-6 ring-1 ring-primary/10">
              <AvatarImage
                src={message.sender.avatar_url || undefined}
                alt={`${message.sender.display_name || message.sender.username}'s avatar`}
              />
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {getInitials(message.sender.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {message.sender.display_name || message.sender.username}
                </span>
              </div>
              <button
                onClick={() => onMessageClick(message.id)}
                className="text-left text-sm hover:underline"
              >
                <p className="line-clamp-2 text-muted-foreground">{message.content}</p>
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onUnpin(message.id)}
              aria-label="Unpin this message"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
