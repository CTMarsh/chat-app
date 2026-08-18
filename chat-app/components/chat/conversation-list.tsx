'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Bell, LogOut, Settings, Users, MessageSquare, Circle, Clock, MinusCircle, EyeOff, Headphones, MessagesSquare, Keyboard, Link, ShieldAlert, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { InviteDialog } from './invite-dialog'
import { NotificationBadge } from './notification-badge'
import { ProfilePopover } from './profile-popover'
import { useChat } from '@/components/providers/chat-provider'
import { usePreferences } from '@/components/providers/preferences-provider'
import { createClient } from '@/lib/supabase/client'
import { checkIsAdmin } from '@/lib/actions/admin'

interface ConversationListProps {
  onSelect?: () => void
}

type ConversationFilter = 'all' | 'chats' | 'inbox'

export function ConversationList({ onSelect }: ConversationListProps) {
  const router = useRouter()
  const { currentUser, conversations, unreadCount } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const { preferences } = usePreferences()

  // Check admin status on mount
  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  // Count widget conversations for the inbox badge
  const widgetConversations = conversations.filter(c => c.type === 'widget')
  const widgetUnreadCount = widgetConversations.filter(c => (c.unread_count || 0) > 0).length

  const filteredConversations = conversations.filter(conv => {
    // Filter by type
    if (filter === 'chats' && conv.type === 'widget') return false
    if (filter === 'inbox' && conv.type !== 'widget') return false

    // Filter by search query
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()

    if (conv.type === 'widget') {
      // Search by visitor name/email
      return (
        conv.visitor_session?.name?.toLowerCase().includes(searchLower) ||
        conv.visitor_session?.email?.toLowerCase().includes(searchLower) ||
        conv.name?.toLowerCase().includes(searchLower)
      )
    }

    if (conv.type === 'group') {
      return conv.name?.toLowerCase().includes(searchLower)
    }

    const otherParticipant = conv.participants.find(
      p => p.user_id !== currentUser?.id
    )
    return (
      otherParticipant?.profile.display_name?.toLowerCase().includes(searchLower) ||
      otherParticipant?.profile.username?.toLowerCase().includes(searchLower)
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

  const getStatusConfig = (status: string | null | undefined) => {
    switch (status) {
      case 'online':
        return { icon: Circle, bgColor: 'bg-ark-good', textColor: 'text-white' }
      case 'away':
        return { icon: Clock, bgColor: 'bg-ark-warn', textColor: 'text-white' }
      case 'dnd':
        return { icon: MinusCircle, bgColor: 'bg-ark-crit', textColor: 'text-white' }
      case 'invisible':
        return { icon: EyeOff, bgColor: 'bg-ark-ink-3', textColor: 'text-white' }
      case 'suspended':
        return { icon: Ban, bgColor: 'bg-ark-crit', textColor: 'text-white' }
      default:
        return { icon: Circle, bgColor: 'bg-ark-ink-3', textColor: 'text-white' }
    }
  }

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ark-blue via-ark-cyan to-transparent" />
        <div className="flex items-center justify-between border-b px-ark-stack py-ark-stack">
          <div className="flex items-center gap-ark-inline">
            {currentUser && (
              <ProfilePopover profile={currentUser} isCurrentUser side="bottom" align="start">
                <button className="relative cursor-pointer" aria-label="Open your profile">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                    <AvatarImage
                      src={currentUser?.avatar_url || undefined}
                      alt={`${currentUser?.display_name || currentUser?.username}'s avatar`}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(currentUser?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {(() => {
                    const currentStatus = preferences?.online_status_preference || currentUser?.status || 'offline'
                    const statusConfig = getStatusConfig(currentStatus)
                    const StatusIcon = statusConfig.icon
                    return (
                      <span className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ${statusConfig.bgColor}`}>
                        <StatusIcon className={`h-3 w-3 ${statusConfig.textColor}`} />
                      </span>
                    )
                  })()}
                </button>
              </ProfilePopover>
            )}
            <div className="flex flex-col">
              <span className="text-ark-body font-semibold">{currentUser?.display_name || currentUser?.username}</span>
              <span className="text-ark-cap text-muted-foreground">@{currentUser?.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-ark-1">
            <NotificationBadge count={unreadCount} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-label="Settings menu">
                  <Settings className="h-5 w-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/chat/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="cursor-pointer">
                  <Keyboard className="mr-2 h-4 w-4" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setInviteOpen(true)} className="cursor-pointer">
                  <Link className="mr-2 h-4 w-4" />
                  Invite to Chat
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    {/* Amber = privileged admin area (matches the admin header
                        accent). Kept distinct from Log out's destructive red so
                        the two don't read as equally critical. */}
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-ark-amber focus:text-ark-amber">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Platform Admin
                    </DropdownMenuItem>
                  </>
                )}
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
      <div className="p-ark-stack pb-ark-2">
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

      {/* Filter tabs */}
      {widgetConversations.length > 0 && (
        <div className="flex gap-ark-1 px-ark-stack pb-ark-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1"
            onClick={() => setFilter('all')}
          >
            <MessagesSquare className="mr-1.5 h-3.5 w-3.5" />
            All
          </Button>
          <Button
            variant={filter === 'chats' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1"
            onClick={() => setFilter('chats')}
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Chats
          </Button>
          <Button
            variant={filter === 'inbox' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1 relative"
            onClick={() => setFilter('inbox')}
          >
            <Headphones className="mr-1.5 h-3.5 w-3.5" />
            Inbox
            {widgetUnreadCount > 0 && (
              <span className="ml-ark-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-ark-micro font-medium text-destructive-foreground">
                {widgetUnreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* New chat buttons */}
      <div className="flex gap-ark-inline px-ark-stack pb-ark-section">
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
      <nav className="flex-1 overflow-y-auto px-ark-1" aria-label="Conversations">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-ark-5 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border shadow-glow">
              <Image
                src="/brand/empty-nodes.png"
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <p className="mt-ark-stack text-ark-body font-medium text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="mt-ark-1 text-ark-cap text-muted-foreground/70">
              Start a new chat to light the first node
            </p>
          </div>
        ) : (
          <ul className="space-y-ark-1 list-none" role="list">
            {filteredConversations.map(conversation => (
              <li key={conversation.id}>
                <ConversationItem
                  conversation={conversation}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Dialogs */}
      <UserSearchDialog open={userSearchOpen} onOpenChange={setUserSearchOpen} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
