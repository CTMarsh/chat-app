'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Trash2, Crown, Shield, User, Users, Info, Eye, Settings, Clock, MessageSquare, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { getWorkspaceSettings, updateWorkspaceSettings } from '@/lib/actions/workspace-settings'
import { searchProfiles } from '@/lib/actions/profiles'
import type { WorkspaceWithMembers, WorkspaceSettings, Profile, WorkspaceRole } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

type Tab = 'general' | 'members'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

type BusinessHours = Record<string, { start: string; end: string; enabled: boolean }>

export default function WorkspaceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null)
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [includeOwners, setIncludeOwners] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('general')

  // Settings form state
  const [defaultPrimaryColor, setDefaultPrimaryColor] = useState('#2f8fff')
  const [defaultWelcomeMessage, setDefaultWelcomeMessage] = useState('')
  const [defaultOfflineMessage, setDefaultOfflineMessage] = useState('')
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false)
  const [businessHours, setBusinessHours] = useState<BusinessHours>({})
  const [timezone, setTimezone] = useState('UTC')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState('')
  const [maxConversationsPerAgent, setMaxConversationsPerAgent] = useState(10)
  const [notifyOnNewConversation, setNotifyOnNewConversation] = useState(true)
  const [notifyOnUnassignedTimeout, setNotifyOnUnassignedTimeout] = useState(false)
  const [unassignedTimeoutMinutes, setUnassignedTimeoutMinutes] = useState(5)

  // Add member dialog state
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('agent')
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
    const loadData = async () => {
      setIsLoading(true)
      const [wsResult, settingsResult] = await Promise.all([
        getWorkspace(resolvedParams.workspaceId),
        getWorkspaceSettings(resolvedParams.workspaceId),
      ])

      if (wsResult.error) {
        setError(wsResult.error)
      } else if (wsResult.data) {
        setWorkspace(wsResult.data)
        setName(wsResult.data.name)
        setIncludeOwners(wsResult.data.include_owners_in_availability ?? true)
      }

      if (settingsResult.data) {
        const s = settingsResult.data
        setSettings(s)
        setDefaultPrimaryColor(s.default_primary_color || '#2f8fff')
        setDefaultWelcomeMessage(s.default_welcome_message || '')
        setDefaultOfflineMessage(s.default_offline_message || '')
        setBusinessHoursEnabled(s.business_hours_enabled)
        setBusinessHours((s.business_hours as BusinessHours) || {})
        setTimezone(s.timezone || 'UTC')
        setAutoReplyEnabled(s.auto_reply_enabled)
        setAutoReplyMessage(s.auto_reply_message || '')
        setMaxConversationsPerAgent(s.max_conversations_per_agent || 10)
        setNotifyOnNewConversation(s.notify_on_new_conversation)
        setNotifyOnUnassignedTimeout(s.notify_on_unassigned_timeout)
        setUnassignedTimeoutMinutes(s.unassigned_timeout_minutes || 5)
      }

      setIsLoading(false)
    }

    loadData()
  }, [resolvedParams.workspaceId])

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    setError(null)

    const { error } = await updateWorkspace(resolvedParams.workspaceId, { name: name.trim() })

    if (error) {
      setError(error)
    } else {
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
      setIncludeOwners(!checked)
    } else {
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    setError(null)

    const { error } = await updateWorkspaceSettings(resolvedParams.workspaceId, {
      default_primary_color: defaultPrimaryColor,
      default_welcome_message: defaultWelcomeMessage,
      default_offline_message: defaultOfflineMessage,
      business_hours_enabled: businessHoursEnabled,
      business_hours: businessHours,
      timezone,
      auto_reply_enabled: autoReplyEnabled,
      auto_reply_message: autoReplyMessage,
      max_conversations_per_agent: maxConversationsPerAgent,
      notify_on_new_conversation: notifyOnNewConversation,
      notify_on_unassigned_timeout: notifyOnUnassignedTimeout,
      unassigned_timeout_minutes: unassignedTimeoutMinutes,
    })

    if (error) {
      setError(error)
    }

    setIsSavingSettings(false)
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setIsAddingMember(true)
    setError(null)

    const { error } = await addWorkspaceMember(resolvedParams.workspaceId, selectedUserId, selectedRole)

    if (error) {
      setError(error)
    } else {
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
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
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setChangingRoleFor(memberId)
    setError(null)

    const { error } = await updateMemberRole(resolvedParams.workspaceId, memberId, newRole)

    if (error) {
      setError(error)
    } else {
      const { data } = await getWorkspace(resolvedParams.workspaceId)
      if (data) setWorkspace(data)
    }

    setChangingRoleFor(null)
  }

  const updateBusinessHoursDay = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-ark-warn" />
      case 'admin':
        return <Shield className="h-4 w-4 text-ark-blue" />
      case 'member':
        return <Eye className="h-4 w-4 text-muted-foreground" />
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

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
  ]

  const renderMemberRow = (member: WorkspaceWithMembers['members'][0]) => (
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
          onValueChange={(value) => handleRoleChange(member.id, value as WorkspaceRole)}
          disabled={changingRoleFor === member.id}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-ark-blue" />
                Admin
              </div>
            </SelectItem>
            <SelectItem value="agent">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Agent
              </div>
            </SelectItem>
            <SelectItem value="member">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Member
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
  )

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

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Workspace Name */}
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-medium">Workspace Name</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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

          {/* Branding Defaults */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Branding Defaults</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>These defaults are inherited by new widgets created in this workspace.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Default Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary-color"
                    value={defaultPrimaryColor}
                    onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={defaultPrimaryColor}
                    onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                    placeholder="#2f8fff"
                    className="w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-msg">Default Welcome Message</Label>
                <Textarea
                  id="welcome-msg"
                  value={defaultWelcomeMessage}
                  onChange={(e) => setDefaultWelcomeMessage(e.target.value)}
                  placeholder="Hi! How can we help you today?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-msg">Default Offline Message</Label>
                <Textarea
                  id="offline-msg"
                  value={defaultOfflineMessage}
                  onChange={(e) => setDefaultOfflineMessage(e.target.value)}
                  placeholder="We're currently offline. Leave a message and we'll get back to you!"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Business Hours</h3>
              </div>
              <Switch
                checked={businessHoursEnabled}
                onCheckedChange={setBusinessHoursEnabled}
              />
            </div>

            {businessHoursEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris / Berlin</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const dayHours = businessHours[day] || { start: '09:00', end: '17:00', enabled: day !== 'saturday' && day !== 'sunday' }
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <Switch
                          checked={dayHours.enabled}
                          onCheckedChange={(checked) => updateBusinessHoursDay(day, 'enabled', checked)}
                        />
                        <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
                        <Input
                          type="time"
                          value={dayHours.start}
                          onChange={(e) => updateBusinessHoursDay(day, 'start', e.target.value)}
                          disabled={!dayHours.enabled}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={dayHours.end}
                          onChange={(e) => updateBusinessHoursDay(day, 'end', e.target.value)}
                          disabled={!dayHours.enabled}
                          className="w-32"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Reply */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Auto-Reply</h3>
              </div>
              <Switch
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
              />
            </div>

            {autoReplyEnabled && (
              <div className="space-y-2">
                <Label htmlFor="auto-reply">Auto-Reply Message</Label>
                <Textarea
                  id="auto-reply"
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  placeholder="Thanks for reaching out! An agent will be with you shortly."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Agent Limits */}
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-medium">Agent Limits</h3>
            <div className="space-y-2">
              <Label htmlFor="max-conversations">Max Conversations per Agent</Label>
              <Input
                id="max-conversations"
                type="number"
                min={1}
                max={100}
                value={maxConversationsPerAgent}
                onChange={(e) => setMaxConversationsPerAgent(parseInt(e.target.value) || 10)}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of concurrent conversations each agent can handle.
              </p>
            </div>
          </div>

          {/* Notification Policies */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Notification Policies</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify on New Conversations</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications when new widget conversations start.
                  </p>
                </div>
                <Switch
                  checked={notifyOnNewConversation}
                  onCheckedChange={setNotifyOnNewConversation}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Unassigned Timeout Alert</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when a conversation stays unassigned too long.
                  </p>
                </div>
                <Switch
                  checked={notifyOnUnassignedTimeout}
                  onCheckedChange={setNotifyOnUnassignedTimeout}
                />
              </div>

              {notifyOnUnassignedTimeout && (
                <div className="space-y-2 pl-4 border-l-2">
                  <Label htmlFor="timeout-minutes">Timeout (minutes)</Label>
                  <Input
                    id="timeout-minutes"
                    type="number"
                    min={1}
                    max={60}
                    value={unassignedTimeoutMinutes}
                    onChange={(e) => setUnassignedTimeoutMinutes(parseInt(e.target.value) || 5)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
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
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as WorkspaceRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent - Can respond to conversations</SelectItem>
                          <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                          <SelectItem value="member">Member - Limited access to assigned conversations</SelectItem>
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
                <Crown className="h-4 w-4 text-ark-warn" />
                Owners & Admins
              </h4>
              <div className="space-y-2">
                {/* Workspace Owner (always first, cannot be removed) */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-ark-amber/10 border border-ark-amber/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-ark-amber/15">
                        <Crown className="h-5 w-5 text-ark-warn" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">You (Owner)</p>
                      <p className="text-sm text-muted-foreground">Workspace creator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-ark-warn" />
                    <span className="text-ark-warn">Owner</span>
                  </div>
                </div>

                {/* Admin members */}
                {workspace.members?.filter(m => m.role === 'admin').map(renderMemberRow)}
              </div>
            </div>

            {/* Agents Section */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Agents
              </h4>
              <div className="space-y-2">
                {workspace.members?.filter(m => m.role === 'agent').map(renderMemberRow)}

                {(!workspace.members || workspace.members.filter(m => m.role === 'agent').length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No agents yet. Add team members to help respond to conversations.
                  </p>
                )}
              </div>
            </div>

            {/* Members Section */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Members
              </h4>
              <div className="space-y-2">
                {workspace.members?.filter(m => m.role === 'member').map(renderMemberRow)}

                {(!workspace.members || workspace.members.filter(m => m.role === 'member').length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No members yet. Members can only see conversations assigned to them.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
