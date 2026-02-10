'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Code, Settings, Trash2, MoreVertical, ExternalLink, Copy, Check } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getWidgets, createWidget, deleteWidget } from '@/lib/actions/widgets'
import { getWorkspaces } from '@/lib/actions/workspaces'
import type { WidgetWithWorkspace, WorkspaceWithMembers } from '@/lib/types/database'

export default function WidgetsSettingsPage() {
  const [widgets, setWidgets] = useState<WidgetWithWorkspace[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceWithMembers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newWidgetName, setNewWidgetName] = useState('')
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)

    const [widgetsResult, workspacesResult] = await Promise.all([
      getWidgets(),
      getWorkspaces(),
    ])

    if (widgetsResult.data) {
      setWidgets(widgetsResult.data)
    }
    if (workspacesResult.data) {
      setWorkspaces(workspacesResult.data)
      if (workspacesResult.data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(workspacesResult.data[0].id)
      }
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateWidget = async () => {
    if (!newWidgetName.trim() || !selectedWorkspaceId) return

    setIsCreating(true)
    setError(null)

    const { data, error } = await createWidget(selectedWorkspaceId, {
      name: newWidgetName.trim(),
    })

    if (error) {
      setError(error)
    } else if (data) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId)
      setWidgets(prev => [...prev, { ...data, workspace: workspace! }])
      setNewWidgetName('')
      setDialogOpen(false)
    }

    setIsCreating(false)
  }

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget? All conversations will be preserved.')) {
      return
    }

    const { error } = await deleteWidget(widgetId)
    if (error) {
      setError(error)
    } else {
      setWidgets(prev => prev.filter(w => w.id !== widgetId))
    }
  }

  const copyEmbedCode = (widget: WidgetWithWorkspace) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const embedCode = `<script src="${baseUrl}/widget/loader.js"></script>
<script>
  ChatWidget.init({
    embedToken: '${widget.embed_token}'
  });
</script>`

    navigator.clipboard.writeText(embedCode)
    setCopiedId(widget.id)
    setTimeout(() => setCopiedId(null), 2000)
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
        <h2 className="text-2xl font-bold tracking-tight">Chat Widgets</h2>
        <p className="text-muted-foreground">
          Create and manage embeddable chat widgets for your websites.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <Code className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Create a workspace first</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to create a workspace before you can add widgets.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/chat/settings/workspaces">
              Go to Workspaces
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    Create a new chat widget to embed on your website.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="widget-workspace">Workspace</Label>
                    <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="widget-name">Widget Name</Label>
                    <Input
                      id="widget-name"
                      placeholder="e.g., Main Website Widget"
                      value={newWidgetName}
                      onChange={(e) => setNewWidgetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateWidget()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWidget}
                    disabled={isCreating || !newWidgetName.trim() || !selectedWorkspaceId}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <Code className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No widgets yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first widget to start receiving chat messages.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Widget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${widget.primary_color}20` }}
                    >
                      <Code className="h-6 w-6" style={{ color: widget.primary_color || '#6366f1' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{widget.name}</h3>
                        {widget.is_active ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {widget.workspace?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEmbedCode(widget)}
                    >
                      {copiedId === widget.id ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chat/settings/widgets/${widget.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/widget?token=${widget.embed_token}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Preview Widget
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteWidget(widget.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Widget
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
