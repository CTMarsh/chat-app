'use client'

import { useState } from 'react'
import { Plus, Search, Bell, LogOut, Settings, Users, MessageSquare, Moon, Sun, Monitor } from 'lucide-react'
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
import { useTheme } from 'next-themes'

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
  const { theme, setTheme } = useTheme()

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()

    if (conv.type === 'group') {
      return conv.name?.toLowerCase().includes(searchLower)
    }

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
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                <AvatarImage src={currentUser?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(currentUser?.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                currentUser?.status === 'online' ? 'bg-green-500' :
                currentUser?.status === 'away' ? 'bg-yellow-500' :
                currentUser?.status === 'dnd' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">{currentUser?.display_name || currentUser?.username}</span>
              <span className="text-xs text-muted-foreground">@{currentUser?.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBadge count={unreadCount} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4" />
                  Light Mode
                  {theme === 'light' && <span className="ml-auto text-xs text-primary">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark Mode
                  {theme === 'dark' && <span className="ml-auto text-xs text-primary">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                  {theme === 'system' && <span className="ml-auto text-xs text-primary">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            className="h-10 bg-muted/50 pl-9 transition-all focus:bg-background focus:shadow-md"
          />
        </div>
      </div>

      {/* New chat buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <Button
          variant="outline"
          className="flex-1 h-10 bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
          onClick={() => setUserSearchOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-10 bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Users className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Start a new chat to begin messaging
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UserSearchDialog open={userSearchOpen} onOpenChange={setUserSearchOpen} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
    </div>
  )
}
