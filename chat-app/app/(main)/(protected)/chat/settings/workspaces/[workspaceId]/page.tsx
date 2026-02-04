'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Trash2, Crown, Shield, User, Users, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getWorkspace, updateWorkspace, addWorkspaceMember, removeWorkspaceMember, updateMemberRole } from '@/lib/actions/workspaces'
import { searchProfiles } from '@/lib/actions/profiles'
import type { WorkspaceWithMembers, Profile } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

export default function WorkspaceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [includeOwners, setIncludeOwners] = useState(true)

  // Add member dialog state
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'agent'>('agent')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null)

  // Load all available profiles when dialog opens
  const loadProfiles = useCallback(async () => {
    if (!workspace) return

    setIsSearching(true)

    // Get existing member IDs to exclude
    const existingMemberIds = [
      workspace.owner_id,
      ...(workspace.members?.map(m => m.user_id) || [])
    ]

    const { data } = await searchProfiles({ excludeUserIds: existingMemberIds })

    setAllProfiles(data || [])
    setFilteredProfiles(data || [])
    setIsSearching(false)
  }, [workspace])

  // Filter profiles as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProfiles(allProfiles)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allProfiles.filter(p =>
      p.username?.toLowerCase().includes(query) ||
      p.display_name?.toLowerCase().includes(query)
    )
    setFilteredProfiles(filtered)
  }, [searchQuery, allProfiles])

  // Load profiles when dialog opens
  useEffect(() => {
    if (addMemberOpen) {
      loadProfiles()
    } else {
      // Reset state when dialog closes
      setSearchQuery('')
      setSelectedUserId('')
      setSelectedRole('agent')
    }
  }, [addMemberOpen, loadProfiles])

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true)
      const { data, error } = await getWorkspace(resolvedParams.workspaceId)

      if (error) {
        setError(error)
      } else if (data) {
        setWorkspace(data)
        setName(data.name)
        setIncludeOwners(data.include_owners_in_availability ?? true)
      }

      setIsLoading(false)
    }

    loadWorkspace()
  }, [resolvedParams.workspaceId])

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    setError(null)

    const { error } = await updateWorkspace(resolvedParams.workspaceId, { name: name.trim() })

    if (error) {
      setError(error)
    } else {
      // Refresh workspace data
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }

    setIsSaving(false)
  }

  const handleIncludeOwnersToggle = async (checked: boolean) => {
    setIncludeOwners(checked)
    setError(null)

    const { error } = await updateWorkspace(resolvedParams.workspaceId, {
      include_owners_in_availability: checked
    })

    if (error) {
      setError(error)
      // Revert on error
      setIncludeOwners(!checked)
    } else {
      // Refresh workspace data
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setIsAddingMember(true)
    setError(null)

    const { error } = await addWorkspaceMember(resolvedParams.workspaceId, selectedUserId, selectedRole)

    if (error) {
      setError(error)
    } else {
      // Refresh workspace data
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)

      // Close dialog (state will be reset by the useEffect)
      setAddMemberOpen(false)
    }

    setIsAddingMember(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    const { error } = await removeWorkspaceMember(resolvedParams.workspaceId, userId)

    if (error) {
      setError(error)
    } else {
      // Refresh workspace data
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'agent') => {
    setChangingRoleFor(memberId)
    setError(null)

    const { error } = await updateMemberRole(resolvedParams.workspaceId, memberId, newRole)

    if (error) {
      setError(error)
    } else {
      // Refresh workspace data
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }

    setChangingRoleFor(null)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workspace not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/chat/settings/workspaces">Back to Workspaces</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat/settings/workspaces">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{workspace.name}</h2>
          <p className="text-muted-foreground">
            Manage workspace settings and team members.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* General Settings */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="font-medium">General Settings</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Workspace Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workspace"
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={isSaving || name === workspace.name}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="include-owners">Include Owners in Availability</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>When enabled, workspace owners count toward agent availability for the widget. Disable if owners are not support agents.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Count owners as online agents for visitor chat
            </p>
          </div>
          <Switch
            id="include-owners"
            checked={includeOwners}
            onCheckedChange={handleIncludeOwnersToggle}
          />
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Team Members</h3>
            <p className="text-sm text-muted-foreground">
              Members can respond to widget conversations.
            </p>
          </div>
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Search for a user to add to this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Search Users</Label>
                  <Input
                    placeholder="Type to filter users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select User</Label>
                  <div className="rounded-lg border max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      </div>
                    ) : filteredProfiles.length > 0 ? (
                      filteredProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                            selectedUserId === profile.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                          onClick={() => setSelectedUserId(profile.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {(profile.display_name || profile.username || '?')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {profile.display_name || profile.username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              @{profile.username}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery ? 'No users found' : 'No available users'}
                      </p>
                    )}
                  </div>
                </div>

                {selectedUserId && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'agent')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent - Can respond to conversations</SelectItem>
                        <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={isAddingMember || !selectedUserId}>
                  {isAddingMember ? 'Adding...' : 'Add Member'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {/* Owners & Admins Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Owners & Admins
            </h4>
            <div className="space-y-2">
              {/* Workspace Owner (always first, cannot be removed) */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900/30">
                      <Crown className="h-5 w-5 text-yellow-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">You (Owner)</p>
                    <p className="text-sm text-muted-foreground">Workspace creator</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-700 dark:text-yellow-500">Owner</span>
                </div>
              </div>

              {/* Admin members */}
              {workspace.members?.filter(m => m.role === 'admin').map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(member.profile?.display_name || member.profile?.username || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profile?.display_name || member.profile?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{member.profile?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'agent')}
                      disabled={changingRoleFor === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="agent">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Agent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agents Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agents
            </h4>
            <div className="space-y-2">
              {workspace.members?.filter(m => m.role === 'agent').map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(member.profile?.display_name || member.profile?.username || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profile?.display_name || member.profile?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{member.profile?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'agent')}
                      disabled={changingRoleFor === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="agent">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Agent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!workspace.members || workspace.members.filter(m => m.role === 'agent').length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No agents yet. Add team members to help respond to conversations.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
