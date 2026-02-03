'use client'

import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChat } from '@/components/providers/chat-provider'
import type { ConversationWithParticipants } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { UnreadBadge } from './unread-badge'

interface ConversationItemProps {
  conversation: ConversationWithParticipants
  onSelect?: () => void
}

export function ConversationItem({ conversation, onSelect }: ConversationItemProps) {
  const router = useRouter()
  const params = useParams()
  const { currentUser } = useChat()

  const isActive = params.conversationId === conversation.id

  const otherParticipant = conversation.participants.find(
    p => p.user_id !== currentUser?.id
  )

  const displayName =
    conversation.type === 'group'
      ? conversation.name
      : otherParticipant?.profile.display_name || otherParticipant?.profile.username

  const avatarUrl =
    conversation.type === 'group'
      ? conversation.avatar_url
      : otherParticipant?.profile.avatar_url

  const status = otherParticipant?.profile.status

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
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const handleClick = () => {
    router.push(`/chat/${conversation.id}`)
    onSelect?.()
  }

  const lastMessage = conversation.last_message
  const lastMessagePreview = lastMessage
    ? lastMessage.sender_id === currentUser?.id
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : conversation.type === 'group'
    ? 'No messages yet'
    : 'Start a conversation'

  const hasUnread = conversation.unread_count && conversation.unread_count > 0

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'hover:bg-muted/80'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn(
          'h-12 w-12 transition-transform duration-200 group-hover:scale-105',
          isActive && 'ring-2 ring-primary-foreground/30'
        )}>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className={cn(
            'text-sm font-medium',
            isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
          )}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {conversation.type === 'direct' && (
          <span className={cn(
            'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2',
            isActive ? 'border-primary' : 'border-background',
            status === 'online' && (isActive ? 'bg-green-400' : 'bg-green-500'),
            status === 'away' && (isActive ? 'bg-yellow-400' : 'bg-yellow-500'),
            status === 'dnd' && (isActive ? 'bg-red-400' : 'bg-red-500'),
            (!status || status === 'offline') && (isActive ? 'bg-gray-300' : 'bg-gray-400')
          )} />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'font-medium truncate',
            hasUnread && !isActive && 'font-semibold'
          )}>
            {displayName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {lastMessage?.created_at && (
              <span className={cn(
                'text-xs',
                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {formatTime(lastMessage.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'truncate text-sm',
            isActive
              ? 'text-primary-foreground/80'
              : hasUnread
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
          )}>
            {lastMessagePreview}
          </p>
          {!isActive && <UnreadBadge count={conversation.unread_count || 0} />}
        </div>
      </div>
    </button>
  )
}
