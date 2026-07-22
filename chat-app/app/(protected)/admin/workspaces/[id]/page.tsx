'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Users,
  Code,
  MessageSquare,
  Shield,
  User,
  Crown,
  Eye,
  Ban,
  CheckCircle,
  Pencil,
  Trash2,
  Plus,
  UserMinus,
  Search,
  ChevronRight,
  Settings,
  Clock,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AdminTable, AdminTableRow } from '@/components/admin/admin-table'
import {
  getAdminWorkspace,
  getAdminUsers,
  getAdminWidgets,
  suspendWorkspace,
  adminUpdateWorkspace,
  adminDeleteWorkspace,
  adminAddWorkspaceMember,
  adminRemoveWorkspaceMember,
  adminUpdateMemberRole,
  adminCreateWidget,
  adminGetWorkspaceSettings,
  adminUpdateWorkspaceSettings,
} from '@/lib/actions/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

type WorkspaceDetail = {
  id: string
  name: string
  owner_id: string
  created_at: string | null
  updated_at: string | null
  include_owners_in_availability: boolean
  owner: { id: string; username: string; display_name: string | null; email: string | null } | null
  members: Array<{
    id: string
    user_id: string
    role: string
    created_at: string | null
    profile: { id: string; username: string; display_name: string | null; email: string | null; avatar_url: string | null }
  }>
  widgets: Array<{
    id: string
    name: string
    is_active: boolean | null
    created_at: string | null
  }>
  conversation_count: number
}

type AdminUser = {
  id: string
  username: string
  display_name: string | null
  email: string | null
}

type AdminWidget = {
  id: string
  name: string
  workspace_id: string
  is_active: boolean | null
  created_at: string | null
  workspace_name: string
  conversation_count: number
}

type Tab = 'overview' | 'settings' | 'members' | 'widgets'

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

export default function AdminWorkspaceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuspending, setIsSuspending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  // Availability toggle state
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)

  // Add member dialog state
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addMemberUserId, setAddMemberUserId] = useState('')
  const [addMemberRole, setAddMemberRole] = useState('agent')
  const [isAddingMember, setIsAddingMember] = useState(false)

  // Settings tab state
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
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

  // Widgets tab state
  const [widgetsList, setWidgetsList] = useState<AdminWidget[]>([])
  const [widgetsLoading, setWidgetsLoading] = useState(false)
  const [widgetSearch, setWidgetSearch] = useState('')
  const [createWidgetOpen, setCreateWidgetOpen] = useState(false)
  const [createWidgetName, setCreateWidgetName] = useState('')
  const [isCreatingWidget, setIsCreatingWidget] = useState(false)

  const loadWorkspace = async () => {
    const { data, error } = await getAdminWorkspace(resolvedParams.id)
    if (data) {
      setWorkspace(data)
      setEditName(data.name)
    }
    if (error) setError(error)
    setIsLoading(false)
  }

  const loadWidgets = async (query?: string) => {
    setWidgetsLoading(true)
    const { data } = await getAdminWidgets(query || undefined, resolvedParams.id)
    if (data) setWidgetsList(data)
    setWidgetsLoading(false)
  }

  useEffect(() => {
    loadWorkspace()
    getAdminUsers().then(({ data }) => {
      if (data) setAllUsers(data.map(u => ({ id: u.id, username: u.username, display_name: u.display_name, email: u.email })))
    })
  }, [resolvedParams.id])

  // Load widgets when switching to widgets tab or when search changes
  useEffect(() => {
    if (activeTab === 'widgets') {
      const timeout = setTimeout(() => {
        loadWidgets(widgetSearch)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [activeTab, widgetSearch])

  // Load settings when switching to settings tab
  useEffect(() => {
    if (activeTab === 'settings' && !settingsLoaded) {
      adminGetWorkspaceSettings(resolvedParams.id).then(({ data }) => {
        if (data) {
          const s = data as Record<string, unknown>
          setDefaultPrimaryColor((s.default_primary_color as string) || '#2f8fff')
          setDefaultWelcomeMessage((s.default_welcome_message as string) || '')
          setDefaultOfflineMessage((s.default_offline_message as string) || '')
          setBusinessHoursEnabled(s.business_hours_enabled as boolean ?? false)
          setBusinessHours((s.business_hours as BusinessHours) || {})
          setTimezone((s.timezone as string) || 'UTC')
          setAutoReplyEnabled(s.auto_reply_enabled as boolean ?? false)
          setAutoReplyMessage((s.auto_reply_message as string) || '')
          setMaxConversationsPerAgent((s.max_conversations_per_agent as number) || 10)
          setNotifyOnNewConversation(s.notify_on_new_conversation as boolean ?? true)
          setNotifyOnUnassignedTimeout(s.notify_on_unassigned_timeout as boolean ?? false)
          setUnassignedTimeoutMinutes((s.unassigned_timeout_minutes as number) || 5)
          setSettingsLoaded(true)
        }
      })
    }
  }, [activeTab, settingsLoaded, resolvedParams.id])

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    setError(null)

    const { error } = await adminUpdateWorkspaceSettings(resolvedParams.id, {
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

    if (error) setError(error)
    setIsSavingSettings(false)
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

  const handleSuspend = async (suspended: boolean) => {
    if (!confirm(suspended
      ? 'Suspend this workspace? All widgets will be deactivated.'
      : 'Activate this workspace?'
    )) return

    setIsSuspending(true)
    setError(null)
    const { error } = await suspendWorkspace(resolvedParams.id, suspended)
    if (error) {
      setError(error)
    } else {
      await loadWorkspace()
    }
    setIsSuspending(false)
  }

  const handleSaveName = async () => {
    if (!editName.trim()) return
    setIsSavingName(true)
    setError(null)
    const { error } = await adminUpdateWorkspace(resolvedParams.id, { name: editName.trim() })
    if (error) {
      setError(error)
    } else {
      setIsEditingName(false)
      await loadWorkspace()
    }
    setIsSavingName(false)
  }

  const handleToggleAvailability = async (checked: boolean) => {
    setIsSavingAvailability(true)
    setError(null)
    const { error } = await adminUpdateWorkspace(resolvedParams.id, { include_owners_in_availability: checked })
    if (error) {
      setError(error)
    } else {
      await loadWorkspace()
    }
    setIsSavingAvailability(false)
  }

  const handleAddMember = async () => {
    if (!addMemberUserId) return
    setIsAddingMember(true)
    setError(null)
    const { error } = await adminAddWorkspaceMember(resolvedParams.id, addMemberUserId, addMemberRole)
    if (error) {
      setError(error)
    } else {
      setAddMemberOpen(false)
      setAddMemberUserId('')
      setAddMemberRole('agent')
      await loadWorkspace()
    }
    setIsAddingMember(false)
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this workspace?`)) return
    setError(null)
    const { error } = await adminRemoveWorkspaceMember(resolvedParams.id, memberId)
    if (error) {
      setError(error)
    } else {
      await loadWorkspace()
    }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    setError(null)
    const { error } = await adminUpdateMemberRole(resolvedParams.id, memberId, newRole)
    if (error) {
      setError(error)
    } else {
      await loadWorkspace()
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const { error } = await adminDeleteWorkspace(resolvedParams.id)
    if (error) {
      setError(error)
      setIsDeleting(false)
    } else {
      router.push('/admin/workspaces')
    }
  }

  const handleCreateWidget = async () => {
    setIsCreatingWidget(true)
    setError(null)
    const { data, error } = await adminCreateWidget(resolvedParams.id, createWidgetName)
    if (error) {
      setError(error)
    } else if (data) {
      setCreateWidgetOpen(false)
      setCreateWidgetName('')
      router.push(`/admin/workspaces/${resolvedParams.id}/widgets/${data.id}`)
    }
    setIsCreatingWidget(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Workspace not found'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/workspaces">Back to Workspaces</Link>
        </Button>
      </div>
    )
  }

  const activeWidgets = workspace.widgets.filter(w => w.is_active)
  const hasActiveWidgets = activeWidgets.length > 0

  // Filter users not already in workspace (not owner and not member)
  const existingUserIds = new Set([
    workspace.owner_id,
    ...workspace.members.map(m => m.user_id),
  ])
  const availableUsers = allUsers.filter(u => !existingUserIds.has(u.id))

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'widgets', label: 'Widgets', icon: Code },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/workspaces">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold h-auto py-1 px-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setIsEditingName(false)
                    setEditName(workspace.name)
                  }
                }}
              />
              <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
                {isSavingName ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setIsEditingName(false)
                setEditName(workspace.name)
              }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{workspace.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">
            Created {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <Button
          variant={hasActiveWidgets ? 'destructive' : 'default'}
          onClick={() => handleSuspend(hasActiveWidgets)}
          disabled={isSuspending}
        >
          {hasActiveWidgets ? (
            <>
              <Ban className="mr-2 h-4 w-4" />
              {isSuspending ? 'Suspending...' : 'Suspend'}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSuspending ? 'Activating...' : 'Activate'}
            </>
          )}
        </Button>
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
                  ? 'border-ark-crit text-ark-crit'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Members
              </div>
              <p className="mt-1 text-2xl font-bold">{workspace.members.length + 1}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Code className="h-4 w-4" />
                Widgets
              </div>
              <p className="mt-1 text-2xl font-bold">{workspace.widgets.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </div>
              <p className="mt-1 text-2xl font-bold">{workspace.conversation_count}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Owner
              </div>
              <p className="mt-1 text-sm font-medium truncate">
                {workspace.owner?.display_name || workspace.owner?.username || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Availability Setting */}
          <div className="rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Include Owners in Availability</h3>
                <p className="text-sm text-muted-foreground">
                  When enabled, workspace owners are included in widget availability checks.
                </p>
              </div>
              <Switch
                checked={workspace.include_owners_in_availability}
                onCheckedChange={handleToggleAvailability}
                disabled={isSavingAvailability}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-destructive/50 p-6 space-y-4">
            <h3 className="font-medium text-destructive">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace, all its widgets, and all conversations.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the workspace &quot;{workspace.name}&quot;, all its
                      widgets ({workspace.widgets.length}), members ({workspace.members.length}), and
                      conversations ({workspace.conversation_count}). This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Branding Defaults */}
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-medium">Branding Defaults</h3>
            <p className="text-sm text-muted-foreground">
              These defaults are inherited by new widgets created in this workspace.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-primary-color">Default Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="admin-primary-color"
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
                <Label htmlFor="admin-welcome-msg">Default Welcome Message</Label>
                <Textarea
                  id="admin-welcome-msg"
                  value={defaultWelcomeMessage}
                  onChange={(e) => setDefaultWelcomeMessage(e.target.value)}
                  placeholder="Hi! How can we help you today?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-offline-msg">Default Offline Message</Label>
                <Textarea
                  id="admin-offline-msg"
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
                  <Label htmlFor="admin-timezone">Timezone</Label>
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
                <Label htmlFor="admin-auto-reply">Auto-Reply Message</Label>
                <Textarea
                  id="admin-auto-reply"
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
              <Label htmlFor="admin-max-conversations">Max Conversations per Agent</Label>
              <Input
                id="admin-max-conversations"
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
                  <Label htmlFor="admin-timeout-minutes">Timeout (minutes)</Label>
                  <Input
                    id="admin-timeout-minutes"
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
            <h3 className="font-medium">Members</h3>
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member</DialogTitle>
                  <DialogDescription>
                    Add a user to this workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.display_name || u.username} ({u.email || u.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={isAddingMember || !addMemberUserId}>
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ark-amber/10">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-ark-amber/15">
                  <Crown className="h-4 w-4 text-ark-warn" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {workspace.owner?.display_name || workspace.owner?.username}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {workspace.owner?.email}
                </p>
              </div>
              <Badge variant="secondary">Owner</Badge>
            </div>

            {/* Members */}
            {workspace.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {(member.profile.display_name || member.profile.username || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.profile.display_name || member.profile.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.profile.email}
                  </p>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(newRole) => handleChangeRole(member.id, newRole)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    </SelectItem>
                    <SelectItem value="agent">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Agent
                      </span>
                    </SelectItem>
                    <SelectItem value="member">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Member
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveMember(
                    member.id,
                    member.profile.display_name || member.profile.username
                  )}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {workspace.members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional members
              </p>
            )}
          </div>
        </div>
      )}

      {/* Widgets Tab */}
      {activeTab === 'widgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={createWidgetOpen} onOpenChange={setCreateWidgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Widget</DialogTitle>
                  <DialogDescription>
                    Create a new widget in this workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-widget-name">Widget Name</Label>
                    <Input
                      id="create-widget-name"
                      value={createWidgetName}
                      onChange={(e) => setCreateWidgetName(e.target.value)}
                      placeholder="My Widget"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateWidgetOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWidget} disabled={isCreatingWidget}>
                    {isCreatingWidget ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {widgetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
            </div>
          ) : widgetsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <Code className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No widgets found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {widgetSearch
                  ? 'Try adjusting your search.'
                  : 'Create a widget to get started.'}
              </p>
            </div>
          ) : (
            <AdminTable>
              {widgetsList.map((widget) => (
                <AdminTableRow
                  key={widget.id}
                  onClick={() => router.push(`/admin/workspaces/${resolvedParams.id}/widgets/${widget.id}`)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ark-blue/10">
                    <Code className="h-5 w-5 text-ark-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{widget.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {widget.created_at ? new Date(widget.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {widget.conversation_count}
                    </span>
                    <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                      {widget.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        </div>
      )}
    </div>
  )
}
