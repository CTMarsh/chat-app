'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Trash2, MoreVertical, Pin, PinOff } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MessageWithSender } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { FileMessage } from './file-message'
import { ReactionPicker } from './reaction-picker'
import { ReactionDisplay } from './reaction-display'
import { MentionHighlight } from './mention-highlight'
import { ReadReceiptIndicator } from './read-receipt-indicator'
import { LinkPreview, extractUrls } from './link-preview'
import { useChat } from '@/components/providers/chat-provider'

interface MessageItemProps {
  message: MessageWithSender
  isOwn: boolean
  showAvatar: boolean
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const { currentUser, toggleReaction, deleteMessage, pinMessage, unpinMessage } = useChat()
  const isDeleted = !!message.deleted_at

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

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    if (!message.reactions?.length || isDeleted) return []

    const groups: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {}

    message.reactions.forEach(reaction => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasReacted: false,
        }
      }
      groups[reaction.emoji].count++
      groups[reaction.emoji].users.push(reaction.user_id)
      if (reaction.user_id === currentUser?.id) {
        groups[reaction.emoji].hasReacted = true
      }
    })

    return Object.values(groups)
  }, [message.reactions, currentUser?.id, isDeleted])

  const existingUserReactions = useMemo(() => {
    if (isDeleted) return []
    return message.reactions
      ?.filter(r => r.user_id === currentUser?.id)
      .map(r => r.emoji) || []
  }, [message.reactions, currentUser?.id, isDeleted])

  const handleToggleReaction = (emoji: string) => {
    toggleReaction(message.id, emoji)
  }

  const handleDelete = async () => {
    if (confirm('Delete this message? This cannot be undone.')) {
      await deleteMessage(message.id)
    }
  }

  const handleTogglePin = async () => {
    if (message.is_pinned) {
      await unpinMessage(message.id)
    } else {
      await pinMessage(message.id)
    }
  }

  // If message is deleted, show placeholder
  if (isDeleted) {
    return (
      <div
        className={cn(
          'group flex gap-3',
          isOwn && 'flex-row-reverse'
        )}
      >
        {showAvatar ? (
          <Avatar className="h-8 w-8 flex-shrink-0 opacity-50">
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
          <div
            className={cn(
              'rounded-2xl px-4 py-2 italic text-muted-foreground',
              'border border-dashed bg-muted/30'
            )}
          >
            <p className="text-sm">This message was deleted</p>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex gap-3',
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

        <div className={cn('flex items-start gap-1', isOwn && 'flex-row-reverse')}>
          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {message.content && (
              <p className="whitespace-pre-wrap break-words text-sm">
                <MentionHighlight content={message.content} currentUserId={currentUser?.id} />
              </p>
            )}
            {message.file_url && message.file_name && message.file_size !== null && message.file_type && (
              <FileMessage
                fileUrl={message.file_url}
                fileName={message.file_name}
                fileSize={message.file_size}
                fileType={message.file_type}
              />
            )}
            {/* Link Previews */}
            {message.link_previews && Array.isArray(message.link_previews) && message.link_previews.length > 0 && (
              <div className="mt-2 space-y-2">
                {(message.link_previews as Array<{url: string; title?: string; description?: string; image?: string; siteName?: string}>).map((preview, index) => (
                  <LinkPreview key={index} preview={preview} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <ReactionPicker
              onReact={handleToggleReaction}
              existingReactions={existingUserReactions}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                <DropdownMenuItem onClick={handleTogglePin}>
                  {message.is_pinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                {isOwn && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ReactionDisplay
          reactions={groupedReactions}
          onToggleReaction={handleToggleReaction}
          isOwn={isOwn}
        />

        <div className="mt-1 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {isOwn && (
            <ReadReceiptIndicator
              isRead={(message.read_receipts?.length || 0) > 0}
              readBy={message.read_receipts?.map(r => r.user_id) || []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
