'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search, Users, Code, ChevronRight, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AdminTable, AdminTableRow } from '@/components/admin/admin-table'
import { Label } from '@/components/ui/label'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAdminWorkspaces, getAdminUsers, adminCreateWorkspace } from '@/lib/actions/admin'

type AdminWorkspace = {
  id: string
  name: string
  owner_id: string
  created_at: string | null
  member_count: number
  widget_count: number
  owner: { username: string; display_name: string | null; email: string | null } | null
}

type AdminUser = {
  id: string
  username: string
  display_name: string | null
  email: string | null
}

export default function AdminWorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createOwnerId, setCreateOwnerId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadWorkspaces = async (query?: string) => {
    setIsLoading(true)
    const { data, error } = await getAdminWorkspaces(query || undefined)
    if (data) setWorkspaces(data)
    if (error) setError(error)
    setIsLoading(false)
  }

  useEffect(() => {
    loadWorkspaces()
    // Load users for owner selector in create dialog
    getAdminUsers().then(({ data }) => {
      if (data) setUsers(data.map(u => ({ id: u.id, username: u.username, display_name: u.display_name, email: u.email })))
    })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadWorkspaces(search)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleCreate = async () => {
    if (!createName.trim() || !createOwnerId) return
    setIsCreating(true)
    setError(null)

    const { data, error } = await adminCreateWorkspace(createName.trim(), createOwnerId)
    if (error) {
      setError(error)
    } else if (data) {
      setCreateOpen(false)
      setCreateName('')
      setCreateOwnerId('')
      router.push(`/admin/workspaces/${data.id}`)
    }
    setIsCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspaces</h2>
          <p className="text-muted-foreground">
            View and manage all platform workspaces.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace and assign an owner.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="My Workspace"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-owner">Owner</Label>
                <Select value={createOwnerId} onValueChange={setCreateOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name || u.username} ({u.email || u.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !createName.trim() || !createOwnerId}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No workspaces found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : 'No workspaces have been created yet.'}
          </p>
        </div>
      ) : (
        <AdminTable>
          {workspaces.map((workspace) => (
            <AdminTableRow
              key={workspace.id}
              onClick={() => router.push(`/admin/workspaces/${workspace.id}`)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{workspace.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  Owner: {workspace.owner?.display_name || workspace.owner?.username || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {workspace.member_count}
                </span>
                <span className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  {workspace.widget_count}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
