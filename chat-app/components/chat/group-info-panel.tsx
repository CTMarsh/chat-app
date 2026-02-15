'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Pencil, Check, X, UserPlus, Search, Loader2, Shield, ShieldCheck, Crown, UserMinus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChat } from '@/components/providers/chat-provider'
import { updateGroupInfo, addGroupMember, removeGroupMember, updateMemberRole } from '@/lib/actions/conversations'
import { searchProfiles } from '@/lib/actions/profiles'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile, ConversationWithParticipants } from '@/lib/types/database'

interface GroupInfoPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: ConversationWithParticipants
}

export function GroupInfoPanel({ open, onOpenChange, conversation }: GroupInfoPanelProps) {
  const { currentUser, refreshConversations, setActiveConversation } = useChat()

  // Edit state
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editName, setEditName] = useState(conversation.name || '')
  const [editDescription, setEditDescription] = useState(conversation.description || '')
  const [isSaving, setIsSaving] = useState(false)

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Remove member state
  const [removingMember, setRemovingMember] = useState<{ userId: string; name: string } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Role change loading
  const [changingRole, setChangingRole] = useState<string | null>(null)

  const isCreator = currentUser?.id === conversation.created_by
  const currentParticipant = conversation.participants.find(p => p.user_id === currentUser?.id)
  const isAdmin = currentParticipant?.role === 'admin' || isCreator

  // Refetch the active conversation to sync participant changes
  const refetchConversation = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        ),
        visitor_session:visitor_sessions(*),
        widget:widgets(*, workspace:workspaces(*))
      `)
      .eq('id', conversation.id)
      .single()

    if (data) {
      setActiveConversation(data as ConversationWithParticipants)
    }
    await refreshConversations()
  }, [conversation.id, setActiveConversation, refreshConversations])

  // Reset edit state when conversation changes
  useEffect(() => {
    setEditName(conversation.name || '')
    setEditDescription(conversation.description || '')
    setIsEditingName(false)
    setIsEditingDescription(false)
  }, [conversation.id, conversation.name, conversation.description])

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (participant: ConversationWithParticipants['participants'][0]) => {
    if (participant.user_id === conversation.created_by) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Crown className="h-3 w-3" />
          Creator
        </span>
      )
    }
    if (participant.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </span>
      )
    }
    if (participant.role === 'moderator') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <Shield className="h-3 w-3" />
          Moderator
        </span>
      )
    }
    return null
  }

  // Save name
  const handleSaveName = async () => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === conversation.name) {
      setIsEditingName(false)
      setEditName(conversation.name || '')
      return
    }

    setIsSaving(true)
    const { error } = await updateGroupInfo(conversation.id, { name: trimmed })
    setIsSaving(false)

    if (error) {
      console.error('Failed to update name:', error)
      setEditName(conversation.name || '')
    } else {
      // Update local conversation state
      setActiveConversation({ ...conversation, name: trimmed })
      await refreshConversations()
    }
    setIsEditingName(false)
  }

  // Save description
  const handleSaveDescription = async () => {
    const trimmed = editDescription.trim()
    if (trimmed === (conversation.description || '')) {
      setIsEditingDescription(false)
      return
    }

    setIsSaving(true)
    const { error } = await updateGroupInfo(conversation.id, { description: trimmed })
    setIsSaving(false)

    if (error) {
      console.error('Failed to update description:', error)
      setEditDescription(conversation.description || '')
    } else {
      setActiveConversation({ ...conversation, description: trimmed })
      await refreshConversations()
    }
    setIsEditingDescription(false)
  }

  // Search for members to add
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const existingIds = conversation.participants.map(p => p.user_id)
    const result = await searchProfiles({
      query: query.trim(),
      limit: 10,
      excludeUserIds: existingIds,
    })

    if (result.data) {
      setSearchResults(result.data)
    }
    setIsSearching(false)
  }, [conversation.participants])

  // Debounced search
  useEffect(() => {
    if (!showAddMember) {
      setSearchQuery('')
      setSearchResults([])
      return
    }

    const debounce = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, showAddMember, handleSearch])

  // Add member
  const handleAddMember = async (userId: string) => {
    setIsAdding(true)
    const { error } = await addGroupMember(conversation.id, userId)
    setIsAdding(false)

    if (error) {
      console.error('Failed to add member:', error)
    } else {
      setShowAddMember(false)
      await refetchConversation()
    }
  }

  // Remove member
  const handleRemoveMember = async () => {
    if (!removingMember) return

    setIsRemoving(true)
    const { error } = await removeGroupMember(conversation.id, removingMember.userId)
    setIsRemoving(false)
    setRemovingMember(null)

    if (error) {
      console.error('Failed to remove member:', error)
    } else {
      await refetchConversation()
    }
  }

  // Change role
  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'moderator' | 'member') => {
    setChangingRole(targetUserId)
    const { error } = await updateMemberRole(conversation.id, targetUserId, newRole)
    setChangingRole(null)

    if (error) {
      console.error('Failed to change role:', error)
    } else {
      await refetchConversation()
    }
  }

  // Sort participants: creator first, then admins, then moderators, then members
  const sortedParticipants = [...conversation.participants].sort((a, b) => {
    if (a.user_id === conversation.created_by) return -1
    if (b.user_id === conversation.created_by) return 1
    const roleOrder = { admin: 0, moderator: 1, member: 2 }
    const aOrder = roleOrder[(a.role as keyof typeof roleOrder) || 'member'] ?? 2
    const bOrder = roleOrder[(b.role as keyof typeof roleOrder) || 'member'] ?? 2
    return aOrder - bOrder
  })

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="space-y-4 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Group Info
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Group Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarImage src={conversation.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-2xl font-medium text-primary">
                  {getInitials(conversation.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Group Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Group Name</label>
                {isAdmin && !isEditingName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value.slice(0, 100))}
                    className="h-9"
                    maxLength={100}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') {
                        setIsEditingName(false)
                        setEditName(conversation.name || '')
                      }
                    }}
                  />
                  <Button size="sm" className="h-9 px-2" onClick={handleSaveName} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2"
                    onClick={() => {
                      setIsEditingName(false)
                      setEditName(conversation.name || '')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">{editName.length}/100</span>
                </div>
              ) : (
                <p className="text-base font-semibold">{conversation.name || 'Unnamed Group'}</p>
              )}
            </div>

            {/* Group Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                {isAdmin && !isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value.slice(0, 500))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={3}
                    maxLength={500}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setIsEditingDescription(false)
                        setEditDescription(conversation.description || '')
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{editDescription.length}/500</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDescription(false)
                          setEditDescription(conversation.description || '')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveDescription} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {conversation.description || (isAdmin ? 'Click edit to add a description' : 'No description')}
                </p>
              )}
            </div>

            {/* Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Members ({conversation.participants.length})
                </h3>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setShowAddMember(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                {sortedParticipants.map(participant => {
                  const profile = participant.profile
                  const isParticipantCreator = participant.user_id === conversation.created_by
                  const isCurrentUser = participant.user_id === currentUser?.id
                  const canManage = isAdmin && !isParticipantCreator && !isCurrentUser

                  return (
                    <div
                      key={participant.user_id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                            {getInitials(profile.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                          profile.status === 'online' && 'bg-green-500',
                          profile.status === 'away' && 'bg-yellow-500',
                          profile.status === 'dnd' && 'bg-red-500',
                          (!profile.status || profile.status === 'offline') && 'bg-gray-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {profile.display_name || profile.username}
                            {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
                          </p>
                          {getRoleBadge(participant)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                      </div>

                      {/* Role management for admins */}
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={participant.role || 'member'}
                            onValueChange={(value) => handleRoleChange(participant.user_id, value as 'admin' | 'moderator' | 'member')}
                            disabled={changingRole === participant.user_id}
                          >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setRemovingMember({
                              userId: participant.user_id,
                              name: profile.display_name || profile.username || 'this user',
                            })}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Created info */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Created {conversation.created_at ? new Date(conversation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="overflow-hidden border-border/50 bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:max-w-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              Add Member
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-border/50 bg-background/50 pl-9 transition-all focus:border-primary/30 focus:shadow-lg focus:shadow-primary/5"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No users found' : 'Search for users to add'}
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      disabled={isAdding}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-primary/5 hover:shadow-md disabled:opacity-50"
                    >
                      <Avatar className="ring-2 ring-primary/10 ring-offset-1 ring-offset-background">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 font-medium text-primary">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate">{user.display_name || user.username}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      {isAdding && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={(open) => { if (!open) setRemovingMember(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removingMember?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from the group. They can be added back later by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
