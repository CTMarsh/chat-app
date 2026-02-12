'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Building2, Users, Crown, Shield, Eye, Trash2, MoreVertical, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getWorkspaces, createWorkspace, deleteWorkspace } from '@/lib/actions/workspaces'
import type { WorkspaceWithMembers } from '@/lib/types/database'

export default function WorkspacesSettingsPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithMembers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspaces = async () => {
    setIsLoading(true)
    const { data, error } = await getWorkspaces()
    if (data) {
      setWorkspaces(data)
    }
    if (error) {
      setError(error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setIsCreating(true)
    setError(null)

    const { data, error } = await createWorkspace(newWorkspaceName.trim())

    if (error) {
      setError(error)
    } else if (data) {
      setWorkspaces(prev => [...prev, { ...data, members: [], widgets: [] }])
      setNewWorkspaceName('')
      setDialogOpen(false)
    }

    setIsCreating(false)
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? All widgets and conversations will be lost.')) {
      return
    }

    const { error } = await deleteWorkspace(workspaceId)
    if (error) {
      setError(error)
    } else {
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workspaces</h2>
        <p className="text-muted-foreground">
          Manage your workspaces and team members for widget support.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                Create a new workspace to organize your support widgets and team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., My Company Support"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={isCreating || !newWorkspaceName.trim()}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No workspaces yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first workspace to start using chat widgets.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {workspaces.map((workspace) => {
            const admins = workspace.members?.filter(m => m.role === 'admin') || []
            const agents = workspace.members?.filter(m => m.role === 'agent') || []
            const members = workspace.members?.filter(m => m.role === 'member') || []
            const ownerCount = 1 // The workspace owner
            const adminCount = admins.length
            const agentCount = agents.length
            const memberCount = members.length

            return (
              <div
                key={workspace.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <Link
                  href={`/chat/settings/workspaces/${workspace.id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{workspace.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1" title="Owners & Admins">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        {ownerCount + adminCount}
                      </span>
                      <span className="flex items-center gap-1" title="Agents">
                        <Users className="h-4 w-4" />
                        {agentCount}
                      </span>
                      {memberCount > 0 && (
                        <span className="flex items-center gap-1" title="Members">
                          <Eye className="h-4 w-4" />
                          {memberCount}
                        </span>
                      )}
                      <span>
                        {workspace.widgets?.length || 0} widgets
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteWorkspace(workspace.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
