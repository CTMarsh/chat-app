'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useChat } from '@/components/providers/chat-provider'
import { createDirectConversation } from '@/lib/actions/conversations'
import type { Profile } from '@/lib/types/database'

interface UserSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const router = useRouter()
  const { currentUser, conversations, refreshConversations } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), [])

  // Fetch users when dialog opens or search query changes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setUsers([])
      return
    }

    const fetchUsers = async () => {
      // Get current user ID from context or session
      let currentUserId = currentUser?.id
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        currentUserId = user?.id
      }

      if (!currentUserId) {
        console.error('No user ID available')
        return
      }

      setIsLoading(true)
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .order('display_name', { ascending: true })
          .limit(20)

        if (searchQuery.trim()) {
          // Search by username, display_name, or email
          query = query.or(
            `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          )
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching users:', error)
          return
        }

        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const debounce = setTimeout(fetchUsers, searchQuery ? 300 : 0)
    return () => clearTimeout(debounce)
  }, [open, searchQuery, currentUser?.id, supabase])

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
        await refreshConversations()
        router.push(`/chat/${result.conversationId}`)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
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
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
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
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
