'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminTable, AdminTableRow } from '@/components/admin/admin-table'
import { getAuditLogs } from '@/lib/actions/admin'

type AuditLog = {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  admin: { username: string; display_name: string | null } | null
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  user_suspended: { label: 'User Suspended', variant: 'destructive' },
  user_activated: { label: 'User Activated', variant: 'default' },
  user_deleted: { label: 'User Deleted', variant: 'destructive' },
  user_mfa_reset: { label: 'MFA Reset', variant: 'outline' },
  admin_granted: { label: 'Admin Granted', variant: 'outline' },
  admin_revoked: { label: 'Admin Revoked', variant: 'outline' },
  workspace_created: { label: 'Workspace Created', variant: 'default' },
  workspace_updated: { label: 'Workspace Updated', variant: 'secondary' },
  workspace_suspended: { label: 'Workspace Suspended', variant: 'destructive' },
  workspace_activated: { label: 'Workspace Activated', variant: 'default' },
  workspace_deleted: { label: 'Workspace Deleted', variant: 'destructive' },
  workspace_member_added: { label: 'Member Added', variant: 'default' },
  workspace_member_removed: { label: 'Member Removed', variant: 'destructive' },
  workspace_member_role_changed: { label: 'Role Changed', variant: 'secondary' },
  widget_created: { label: 'Widget Created', variant: 'default' },
  widget_updated: { label: 'Widget Updated', variant: 'secondary' },
  widget_deleted: { label: 'Widget Deleted', variant: 'destructive' },
  setting_updated: { label: 'Setting Updated', variant: 'secondary' },
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('all')

  const loadLogs = async (action?: string) => {
    setIsLoading(true)
    const filters = action && action !== 'all' ? { action } : undefined
    const { data, error } = await getAuditLogs(filters)
    if (data) setLogs(data)
    if (error) setError(error)
    setIsLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    loadLogs(actionFilter)
  }, [actionFilter])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">
          Track all administrative actions on the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_suspended">User Suspended</SelectItem>
              <SelectItem value="user_activated">User Activated</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
              <SelectItem value="user_mfa_reset">MFA Reset</SelectItem>
              <SelectItem value="admin_granted">Admin Granted</SelectItem>
              <SelectItem value="admin_revoked">Admin Revoked</SelectItem>
              <SelectItem value="workspace_created">Workspace Created</SelectItem>
              <SelectItem value="workspace_updated">Workspace Updated</SelectItem>
              <SelectItem value="workspace_suspended">Workspace Suspended</SelectItem>
              <SelectItem value="workspace_activated">Workspace Activated</SelectItem>
              <SelectItem value="workspace_deleted">Workspace Deleted</SelectItem>
              <SelectItem value="workspace_member_added">Member Added</SelectItem>
              <SelectItem value="workspace_member_removed">Member Removed</SelectItem>
              <SelectItem value="workspace_member_role_changed">Role Changed</SelectItem>
              <SelectItem value="widget_created">Widget Created</SelectItem>
              <SelectItem value="widget_updated">Widget Updated</SelectItem>
              <SelectItem value="widget_deleted">Widget Deleted</SelectItem>
              <SelectItem value="setting_updated">Setting Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <ScrollText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No audit logs</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Administrative actions will appear here.
          </p>
        </div>
      ) : (
        <AdminTable>
          {logs.map((log) => {
            const actionInfo = getActionInfo(log.action)
            return (
              <AdminTableRow key={log.id}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={actionInfo.variant}>
                      {actionInfo.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      on {log.target_type}
                      {log.target_id && (
                        <span className="font-mono text-xs ml-1">
                          {log.target_id.substring(0, 8)}...
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>by {log.admin?.display_name || log.admin?.username || 'Unknown'}</span>
                    <span>·</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                  {Object.keys(log.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground font-mono">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              </AdminTableRow>
            )
          })}
        </AdminTable>
      )}
    </div>
  )
}
