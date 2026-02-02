'use client'

import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { MessageWithSender } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface MessageItemProps {
  message: MessageWithSender
  isOwn: boolean
  showAvatar: boolean
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: string | null | undefined) => {
    if (!date) return ''
    try {
      return format(new Date(date), 'HH:mm')
    } catch {
      return ''
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isOwn && 'flex-row-reverse'
      )}
    >
      {showAvatar ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(message.sender.display_name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div
        className={cn(
          'flex max-w-[70%] flex-col',
          isOwn && 'items-end'
        )}
      >
        {showAvatar && !isOwn && (
          <span className="mb-1 text-xs font-medium text-muted-foreground">
            {message.sender.display_name || message.sender.username}
          </span>
        )}

        {message.reply_to && (
          <div
            className={cn(
              'mb-1 rounded border-l-2 border-primary/50 bg-muted/50 px-2 py-1 text-xs',
              isOwn && 'text-right'
            )}
          >
            <span className="font-medium">
              {message.reply_to.sender.display_name || message.reply_to.sender.username}
            </span>
            <p className="truncate text-muted-foreground">
              {message.reply_to.content}
            </p>
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
      </div>
    </div>
  )
}
