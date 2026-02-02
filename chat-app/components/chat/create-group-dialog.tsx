'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, X, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useChat } from '@/components/providers/chat-provider'
import type { Profile } from '@/lib/types/database'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const router = useRouter()
  const { currentUser, refreshConversations } = useChat()
  const [step, setStep] = useState<'members' | 'details'>('members')
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([])
        return
      }

      setIsLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id || '')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (data) {
        setUsers(data)
      }
      setIsLoading(false)
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, supabase, currentUser?.id])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('members')
      setGroupName('')
      setSearchQuery('')
      setUsers([])
      setSelectedUsers([])
    }
  }, [open])

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleUser = (user: Profile) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      }
      return [...prev, user]
    })
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return

    setIsCreating(true)
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          created_by: currentUser?.id,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants (including current user as admin)
      const participants = [
        { conversation_id: conversation.id, user_id: currentUser!.id, role: 'admin' },
        ...selectedUsers.map(user => ({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'member',
        })),
      ]

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (partError) throw partError

      await refreshConversations()
      router.push(`/chat/${conversation.id}`)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'members' ? 'Add Members' : 'Group Details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'members' ? (
          <div className="space-y-4">
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm"
                  >
                    <span>{user.display_name || user.username}</span>
                    <button
                      onClick={() => toggleUser(user)}
                      className="rounded-full p-0.5 hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Users list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No users found' : 'Search for users to add'}
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map(user => {
                    const isSelected = selectedUsers.some(u => u.id === user.id)
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
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
                          </p>
                        </div>
                        {isSelected && (
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <Label className="text-muted-foreground">
                {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.display_name || user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'members' ? (
            <Button
              onClick={() => setStep('details')}
              disabled={selectedUsers.length === 0}
            >
              Next
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('members')}>
                Back
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
