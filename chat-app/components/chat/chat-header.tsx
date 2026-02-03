'use client'

import { MoreVertical, Phone, Video, Info, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChat } from '@/components/providers/chat-provider'
import { SearchDialog } from './search-dialog'
import { ProfilePopover } from './profile-popover'
import { cn } from '@/lib/utils'

export function ChatHeader() {
  const { activeConversation, currentUser } = useChat()

  if (!activeConversation) return null

  // Get the other participant for direct chats
  const otherParticipant = activeConversation.participants.find(
    p => p.user_id !== currentUser?.id
  )

  // Determine display name and avatar
  const displayName =
    activeConversation.type === 'group'
      ? activeConversation.name
      : otherParticipant?.profile.display_name || otherParticipant?.profile.username

  const avatarUrl =
    activeConversation.type === 'group'
      ? activeConversation.avatar_url
      : otherParticipant?.profile.avatar_url

  const status = otherParticipant?.profile.status
  const participantCount = activeConversation.participants.length

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusText = () => {
    if (activeConversation.type === 'group') {
      return `${participantCount} members`
    }
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'dnd': return 'Do Not Disturb'
      default: return 'Offline'
    }
  }

  return (
    <header className="relative flex items-center justify-between border-b bg-card/30 px-4 py-3 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="relative md:hidden">
          {/* Spacer for mobile menu button */}
          <div className="w-10" />
        </div>

        {activeConversation.type === 'direct' && otherParticipant?.profile ? (
          <ProfilePopover
            profile={otherParticipant.profile}
            isCurrentUser={false}
            side="bottom"
            align="start"
          >
            <button className="relative cursor-pointer">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 font-medium text-primary">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <span className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                status === 'online' && 'bg-green-500',
                status === 'away' && 'bg-yellow-500',
                status === 'dnd' && 'bg-red-500',
                (!status || status === 'offline') && 'bg-gray-400'
              )} />
            </button>
          </ProfilePopover>
        ) : (
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 font-medium text-primary">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
          </div>
        )}

        <div>
          <h2 className="font-semibold">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{getStatusText()}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <SearchDialog
          trigger={
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
              <Search className="h-5 w-5" />
            </Button>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="shadow-lg shadow-primary/5">
            <DropdownMenuItem className="cursor-pointer">
              <Info className="mr-2 h-4 w-4" />
              View Info
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
