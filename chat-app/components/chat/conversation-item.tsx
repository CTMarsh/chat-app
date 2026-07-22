'use client'

import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Circle, Clock, MinusCircle, EyeOff, Headphones, Building2, Ban } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChat } from '@/components/providers/chat-provider'
import type { ConversationWithParticipants } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { UnreadBadge } from './unread-badge'
import { ProfilePopover } from './profile-popover'

interface ConversationItemProps {
  conversation: ConversationWithParticipants
  onSelect?: () => void
}

export function ConversationItem({ conversation, onSelect }: ConversationItemProps) {
  const router = useRouter()
  const params = useParams()
  const { currentUser } = useChat()

  const isActive = params.conversationId === conversation.id
  const isWidget = conversation.type === 'widget'

  const otherParticipant = conversation.participants.find(
    p => p.user_id !== currentUser?.id
  )

  // For widget conversations, show visitor name from session or last message
  const displayName = isWidget
    ? conversation.visitor_session?.name || conversation.name || 'Visitor'
    : conversation.type === 'group'
      ? conversation.name
      : otherParticipant?.profile.display_name || otherParticipant?.profile.username

  const avatarUrl = isWidget
    ? null // Visitors don't have avatars
    : conversation.type === 'group'
      ? conversation.avatar_url
      : otherParticipant?.profile.avatar_url

  const status = isWidget ? null : otherParticipant?.profile.status

  const getStatusConfig = (status: string | null | undefined) => {
    switch (status) {
      case 'online':
        return { icon: Circle, bgColor: 'bg-green-500', bgColorActive: 'bg-green-400', hasIcon: true }
      case 'away':
        return { icon: Clock, bgColor: 'bg-yellow-500', bgColorActive: 'bg-yellow-400', hasIcon: true }
      case 'dnd':
        return { icon: MinusCircle, bgColor: 'bg-red-500', bgColorActive: 'bg-red-400', hasIcon: true }
      case 'invisible':
        return { icon: EyeOff, bgColor: 'bg-gray-400', bgColorActive: 'bg-gray-300', hasIcon: true }
      case 'suspended':
        return { icon: Ban, bgColor: 'bg-red-700', bgColorActive: 'bg-red-600', hasIcon: true }
      default:
        return { icon: Circle, bgColor: 'bg-gray-400', bgColorActive: 'bg-gray-300', hasIcon: false }
    }
  }

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
    ? lastMessage.visitor_name
      ? `${lastMessage.visitor_name}: ${lastMessage.content}` // Visitor message
      : lastMessage.sender_id === currentUser?.id
        ? `You: ${lastMessage.content}`
        : lastMessage.content
    : isWidget
      ? 'New support chat'
      : conversation.type === 'group'
        ? 'No messages yet'
        : 'Start a conversation'

  const hasUnread = conversation.unread_count && conversation.unread_count > 0

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
        // Constellation active node — glassy blue + hairline ring + signature glow
        isActive
          ? 'bg-primary/15 ring-1 ring-primary/40 shadow-[0_0_18px_rgba(47,143,255,0.25)]'
          : 'hover:bg-muted/80'
      )}
    >
      <div className="relative shrink-0">
        {isWidget ? (
          // Widget conversation - show headphones icon with visitor initials
          <div className="relative">
            <Avatar className={cn(
              'h-12 w-12 transition-transform duration-200 group-hover:scale-105',
              isActive && 'ring-2 ring-primary/40'
            )}>
              <AvatarFallback className="bg-ark-cyan/15 text-sm font-medium text-secondary-foreground dark:text-ark-cyan">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-ark-cyan">
              <Headphones className="h-3 w-3 text-ark-void" />
            </span>
          </div>
        ) : conversation.type === 'direct' && otherParticipant?.profile ? (
          <ProfilePopover profile={otherParticipant.profile} side="right" align="start">
            <div
              role="button"
              tabIndex={0}
              className="relative cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
            >
              <Avatar className={cn(
                'h-12 w-12 transition-transform duration-200 group-hover:scale-105',
                isActive && 'ring-2 ring-primary/40'
              )}>
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-secondary-foreground dark:text-ark-blue-bright">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              {(() => {
                const statusConfig = getStatusConfig(status)
                const StatusIcon = statusConfig.icon
                return (
                  <span className={cn(
                    'absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-background',
                    isActive ? statusConfig.bgColorActive : statusConfig.bgColor,
                    statusConfig.hasIcon ? 'h-5 w-5' : 'h-3.5 w-3.5'
                  )}>
                    {statusConfig.hasIcon && <StatusIcon className="h-3 w-3 text-white" />}
                  </span>
                )
              })()}
            </div>
          </ProfilePopover>
        ) : (
          <Avatar className={cn(
            'h-12 w-12 transition-transform duration-200 group-hover:scale-105',
            isActive && 'ring-2 ring-primary/40'
          )}>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-secondary-foreground dark:text-ark-blue-bright">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
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
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(lastMessage.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'truncate text-sm',
            hasUnread && !isActive
              ? 'font-medium text-foreground'
              : 'text-muted-foreground'
          )}>
            {lastMessagePreview}
          </p>
          {!isActive && <UnreadBadge count={conversation.unread_count || 0} />}
        </div>
        {/* Workspace name for widget conversations */}
        {isWidget && conversation.widget?.workspace?.name && (
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="text-xs truncate text-muted-foreground/70">
              {conversation.widget.workspace.name}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
