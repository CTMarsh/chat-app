'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChat } from '@/components/providers/chat-provider'
import { createDirectConversation } from '@/lib/actions/conversations'
import { searchProfiles } from '@/lib/actions/profiles'
import type { Profile } from '@/lib/types/database'

interface UserSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const USERS_PER_PAGE = 20

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const router = useRouter()
  const { conversations, refreshConversations } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  // Fetch users with pagination support
  const fetchUsers = useCallback(async (query: string, resetOffset = true) => {
    const currentOffset = resetOffset ? 0 : offset

    if (resetOffset) {
      setIsLoading(true)
      setOffset(0)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const result = await searchProfiles({
        query: query.trim() || undefined,
        limit: USERS_PER_PAGE,
        offset: currentOffset
      })

      if (result.error) {
        console.error('Error fetching users:', result.error)
        return
      }

      if (result.data) {
        if (resetOffset) {
          setUsers(result.data)
        } else {
          setUsers(prev => [...prev, ...result.data!])
        }
        setHasMore(result.hasMore)
        if (!resetOffset) {
          setOffset(currentOffset + result.data.length)
        } else {
          setOffset(result.data.length)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [offset])

  // Initial fetch and search debounce
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setUsers([])
      setHasMore(false)
      setOffset(0)
      return
    }

    // Debounce search
    const debounce = setTimeout(() => {
      fetchUsers(searchQuery, true)
    }, searchQuery ? 300 : 0)
    return () => clearTimeout(debounce)
  }, [open, searchQuery])

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchUsers(searchQuery, false)
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

  const handleSelectUser = async (user: Profile) => {
    // Check if conversation already exists (client-side check for immediate feedback)
    const existingConversation = conversations.find(conv => {
      if (conv.type !== 'direct') return false
      return conv.participants.some(p => p.user_id === user.id)
    })

    if (existingConversation) {
      router.push(`/chat/${existingConversation.id}`)
      onOpenChange(false)
      return
    }

    // Create new direct conversation using server action (secure, server-side)
    setIsCreating(true)
    try {
      const result = await createDirectConversation(user.id)

      if (result.error) {
        console.error('Error creating conversation:', result.error)
        return
      }

      if (result.conversationId) {
        // Navigate immediately for better UX, refresh in background
        router.push(`/chat/${result.conversationId}`)
        onOpenChange(false)
        // Refresh conversations list in background (don't await)
        refreshConversations()
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/50 bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:max-w-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            New Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-border/50 bg-background/50 pl-9 transition-all focus:border-primary/30 focus:shadow-lg focus:shadow-primary/5"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No users found' : 'No other users available'}
              </div>
            ) : (
              <div className="space-y-1">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    disabled={isCreating}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-primary/5 hover:shadow-md disabled:opacity-50"
                  >
                    <Avatar className="ring-2 ring-primary/10 ring-offset-1 ring-offset-background transition-all group-hover:ring-primary/20">
                      <AvatarImage src={user.avatar_url || undefined} alt={`${user.display_name || user.username}'s avatar`} />
                      <AvatarFallback className="bg-primary/10 font-medium text-primary">{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                        {user.email && ` · ${user.email}`}
                      </p>
                    </div>
                    {user.status === 'online' && (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"
                        aria-label="Online"
                        title="Online"
                      />
                    )}
                  </button>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
