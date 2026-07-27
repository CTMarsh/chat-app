'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Building2, ShieldAlert, ChevronRight, UserPlus, Copy, Check, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminTable, AdminTableRow } from '@/components/admin/admin-table'
import { getAdminUsers, adminCreateUser } from '@/lib/actions/admin'

type AdminUser = {
  id: string
  username: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  status: string | null
  is_platform_admin: boolean
  created_at: string | null
  last_seen_at: string | null
  workspace_count: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createName, setCreateName] = useState('')
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const loadUsers = async (query?: string) => {
    setIsLoading(true)
    const { data, error } = await getAdminUsers(query || undefined)
    if (data) setUsers(data)
    if (error) setError(error)
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers(search)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'online': return 'bg-ark-good'
      case 'away': return 'bg-ark-warn'
      case 'dnd': return 'bg-ark-crit'
      case 'suspended': return 'bg-ark-crit'
      default: return 'bg-ark-ink-3'
    }
  }

  const resetCreateDialog = () => {
    setCreateEmail('')
    setCreateName('')
    setSendConfirmation(true)
    setCreating(false)
    setCreateError(null)
    setCreatedCredentials(null)
    setCopied(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetCreateDialog()
    setCreateOpen(open)
  }

  const handleCreateUser = async () => {
    if (!createEmail.trim()) return
    setCreating(true)
    setCreateError(null)

    const { data, error } = await adminCreateUser({
      email: createEmail.trim(),
      name: createName.trim() || undefined,
      sendConfirmationEmail: sendConfirmation,
    })

    setCreating(false)

    if (error) {
      setCreateError(error)
      return
    }

    if (data) {
      setCreatedCredentials({ email: createEmail.trim(), password: data.generatedPassword })
      loadUsers(search)
    }
  }

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return
    await navigator.clipboard.writeText(
      `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            View and manage all platform users.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by username, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : 'No users have signed up yet.'}
          </p>
        </div>
      ) : (
        <AdminTable>
          {users.map((user) => {
            // Fall back to the email local-part (then a dash) so a user with no
            // display_name/username never renders a bare "?" avatar or "@" handle.
            const emailLocal = user.email?.split('@')[0] || null
            const primaryLabel = user.display_name || user.username || emailLocal || '—'
            const avatarInitial = primaryLabel === '—' ? '?' : primaryLabel[0].toUpperCase()
            return (
            <AdminTableRow
              key={user.id}
              onClick={() => router.push(`/admin/users/${user.id}`)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {primaryLabel}
                  </p>
                  {user.is_platform_admin && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <ShieldAlert className="mr-0.5 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  {user.status === 'suspended' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-ark-crit text-ark-crit">
                      Suspended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user.username ? `@${user.username}` : (user.email || 'No username')}
                  {user.username && user.email ? ` · ${user.email}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {user.workspace_count}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </AdminTableRow>
            )
          })}
        </AdminTable>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {!createdCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  Create a new user account. A secure password will be generated automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="user@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-name">Name (optional)</Label>
                  <Input
                    id="create-name"
                    type="text"
                    placeholder="Full name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="send-confirmation" className="text-sm font-medium">
                      Send confirmation email
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {sendConfirmation
                        ? 'User must confirm their email before logging in'
                        : 'User can log in immediately — share the generated credentials with them'}
                    </p>
                  </div>
                  <Switch
                    id="send-confirmation"
                    checked={sendConfirmation}
                    onCheckedChange={setSendConfirmation}
                  />
                </div>

                {createError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {createError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={!createEmail.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>User Created</DialogTitle>
                <DialogDescription>
                  Share these credentials securely with the new user.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {createdCredentials.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Password: </span>
                    {createdCredentials.password}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyCredentials}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy credentials
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 rounded-lg border border-ark-warn/20 bg-ark-warn/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ark-warn" />
                  <div className="text-ark-warn">
                    <p className="font-medium">This password will not be shown again.</p>
                    <p className="mt-1">Share it securely with the user.</p>
                    {sendConfirmation && (
                      <p className="mt-1">The user must confirm their email before logging in.</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
