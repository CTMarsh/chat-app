'use client'

import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChat } from '@/components/providers/chat-provider'
import type { ConversationWithParticipants } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface ConversationItemProps {
  conversation: ConversationWithParticipants
  onSelect?: () => void
}

export function ConversationItem({ conversation, onSelect }: ConversationItemProps) {
  const router = useRouter()
  const params = useParams()
  const { currentUser } = useChat()

  const isActive = params.conversationId === conversation.id

  // Get the other participant for direct chats
  const otherParticipant = conversation.participants.find(
    p => p.user_id !== currentUser?.id
  )

  // Determine display name and avatar
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

  // Get last message preview
  const lastMessage = conversation.last_message
  const lastMessagePreview = lastMessage
    ? lastMessage.sender_id === currentUser?.id
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : conversation.type === 'group'
    ? 'No messages yet'
    : 'Start a conversation'

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
        isActive && 'bg-accent'
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        {conversation.type === 'direct' && status === 'online' && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{displayName}</span>
          {lastMessage?.created_at && (
            <span className="text-xs text-muted-foreground">
              {formatTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {lastMessagePreview}
        </p>
      </div>
    </button>
  )
}
