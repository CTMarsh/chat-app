'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Shield,
  ShieldAlert,
  User,
  Crown,
  Eye,
  Ban,
  CheckCircle,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  getAdminUser,
  suspendUser,
  setUserAdmin,
  adminDeleteUser,
  adminResetUserMFA,
} from '@/lib/actions/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

type UserDetail = {
  id: string
  username: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  status: string | null
  is_platform_admin: boolean
  created_at: string | null
  last_seen_at: string | null
  workspaces: Array<{
    workspace_id: string
    role: string
    workspace: { id: string; name: string; owner_id: string }
  }>
  owned_workspaces: Array<{ id: string; name: string }>
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [isResettingMFA, setIsResettingMFA] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const reload = async () => {
    const { data, error } = await getAdminUser(resolvedParams.id)
    if (data) setUser(data)
    if (error) setError(error)
  }

  useEffect(() => {
    const load = async () => {
      await reload()
      setIsLoading(false)
    }
    load()
  }, [resolvedParams.id])

  const handleSuspend = async (suspended: boolean) => {
    if (!confirm(suspended
      ? 'Suspend this user? They will not be able to log in.'
      : 'Activate this user?'
    )) return

    setIsActing(true)
    setError(null)
    const { error } = await suspendUser(resolvedParams.id, suspended)
    if (error) setError(error)
    else await reload()
    setIsActing(false)
  }

  const handleToggleAdmin = async () => {
    if (!user) return
    const newState = !user.is_platform_admin
    if (!confirm(newState
      ? 'Grant platform admin privileges to this user?'
      : 'Revoke platform admin privileges from this user?'
    )) return

    setIsActing(true)
    setError(null)
    const { error } = await setUserAdmin(resolvedParams.id, newState)
    if (error) setError(error)
    else await reload()
    setIsActing(false)
  }

  const handleResetMFA = async () => {
    setIsResettingMFA(true)
    setError(null)
    const { error } = await adminResetUserMFA(resolvedParams.id)
    if (error) {
      setError(error)
    } else {
      await reload()
    }
    setIsResettingMFA(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const { error } = await adminDeleteUser(resolvedParams.id)
    if (error) {
      setError(error)
      setIsDeleting(false)
    } else {
      router.push('/admin/users')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'User not found'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>
    )
  }

  const isSuspended = user.status === 'suspended'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {(user.display_name || user.username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {user.display_name || user.username}
              </h2>
              {user.is_platform_admin && (
                <Badge variant="destructive">
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
              )}
              {isSuspended && (
                <Badge variant="outline" className="border-ark-crit text-ark-crit">
                  Suspended
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              @{user.username} {user.email ? `· ${user.email}` : ''}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant={isSuspended ? 'default' : 'destructive'}
          onClick={() => handleSuspend(!isSuspended)}
          disabled={isActing}
        >
          {isSuspended ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isActing ? 'Activating...' : 'Activate User'}
            </>
          ) : (
            <>
              <Ban className="mr-2 h-4 w-4" />
              {isActing ? 'Suspending...' : 'Suspend User'}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleToggleAdmin}
          disabled={isActing}
        >
          {user.is_platform_admin ? (
            <>
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke Admin
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Grant Admin
            </>
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isResettingMFA}>
              <KeyRound className="mr-2 h-4 w-4" />
              {isResettingMFA ? 'Resetting...' : 'Reset MFA'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset MFA?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all MFA factors for {user.display_name || user.username}.
                They will be required to set up MFA again on their next login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetMFA}>
                Reset MFA
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Profile Info */}
      <div className="rounded-lg border p-6 space-y-3">
        <h3 className="font-medium">Profile Details</h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">@{user.username}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{user.status || 'offline'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Joined</p>
            <p className="font-medium">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Seen</p>
            <p className="font-medium">
              {user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Owned Workspaces */}
      {user.owned_workspaces.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="font-medium">Owned Workspaces</h3>
          <div className="space-y-2">
            {user.owned_workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/admin/workspaces/${ws.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ark-amber/15">
                  <Crown className="h-4 w-4 text-ark-warn" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{ws.name}</p>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Workspace Memberships */}
      {user.workspaces.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="font-medium">Workspace Memberships</h3>
          <div className="space-y-2">
            {user.workspaces.map((membership) => (
              <Link
                key={membership.workspace_id}
                href={`/admin/workspaces/${membership.workspace_id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{membership.workspace.name}</p>
                </div>
                <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'}>
                  {membership.role === 'admin' ? (
                    <><Shield className="mr-1 h-3 w-3" /> Admin</>
                  ) : membership.role === 'member' ? (
                    <><Eye className="mr-1 h-3 w-3" /> Member</>
                  ) : (
                    <><User className="mr-1 h-3 w-3" /> Agent</>
                  )}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/50 p-6 space-y-4">
        <h3 className="font-medium text-destructive">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete User</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this user and all their data. This cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the user &quot;{user.display_name || user.username}&quot;
                  ({user.email || 'no email'}), including their profile, workspace memberships
                  ({user.workspaces.length}), and owned workspaces ({user.owned_workspaces.length}).
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
