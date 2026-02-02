'use client'

import { useState } from 'react'
import { Plus, Search, Bell, LogOut, Settings, Users, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConversationItem } from './conversation-item'
import { UserSearchDialog } from './user-search-dialog'
import { CreateGroupDialog } from './create-group-dialog'
import { NotificationBadge } from './notification-badge'
import { useChat } from '@/components/providers/chat-provider'
import { createClient } from '@/lib/supabase/client'

interface ConversationListProps {
  onSelect?: () => void
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const router = useRouter()
  const { currentUser, conversations, unreadCount } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const supabase = createClient()

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()

    if (conv.type === 'group') {
      return conv.name?.toLowerCase().includes(searchLower)
    }

    // For direct chats, search by the other participant's name
    const otherParticipant = conv.participants.find(
      p => p.user_id !== currentUser?.id
    )
    return (
      otherParticipant?.profile.display_name?.toLowerCase().includes(searchLower) ||
      otherParticipant?.profile.username.toLowerCase().includes(searchLower)
    )
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={currentUser?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(currentUser?.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{currentUser?.display_name || currentUser?.username}</span>
            <span className="text-xs text-muted-foreground">@{currentUser?.username}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBadge count={unreadCount} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* New chat buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setUserSearchOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Users className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a new chat to begin messaging
            </p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <UserSearchDialog open={userSearchOpen} onOpenChange={setUserSearchOpen} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
    </div>
  )
}
