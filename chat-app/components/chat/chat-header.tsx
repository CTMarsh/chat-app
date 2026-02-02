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
    return status === 'online' ? 'Online' : 'Offline'
  }

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative md:hidden">
          {/* Spacer for mobile menu button */}
          <div className="w-10" />
        </div>

        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>

        <div>
          <h2 className="font-semibold">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{getStatusText()}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <SearchDialog
          trigger={
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Info className="mr-2 h-4 w-4" />
              View Info
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
