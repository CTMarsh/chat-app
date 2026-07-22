'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Code,
  MessageSquare,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getAdminWidget,
  adminUpdateWidget,
  adminDeleteWidget,
  adminRegenerateWidgetToken,
} from '@/lib/actions/admin'

interface PageProps {
  params: Promise<{ id: string; widgetId: string }>
}

type WidgetDetail = {
  id: string
  name: string
  workspace_id: string
  embed_token: string | null
  primary_color: string | null
  position: string | null
  welcome_message: string | null
  offline_message: string | null
  require_email: boolean | null
  collect_name: boolean | null
  is_active: boolean | null
  allowed_origins: string[] | null
  created_at: string | null
  updated_at: string | null
  workspace_name: string
  conversation_count: number
}

export default function AdminWidgetDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [widget, setWidget] = useState<WidgetDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2f8fff')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [offlineMessage, setOfflineMessage] = useState('')
  const [requireEmail, setRequireEmail] = useState(true)
  const [collectName, setCollectName] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [allowedOrigins, setAllowedOrigins] = useState('')

  const workspaceUrl = `/admin/workspaces/${resolvedParams.id}`

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const { data, error } = await getAdminWidget(resolvedParams.widgetId)
      if (error) {
        setError(error)
      } else if (data) {
        setWidget(data)
        setName(data.name)
        setPrimaryColor(data.primary_color || '#2f8fff')
        setPosition((data.position as 'bottom-right' | 'bottom-left') || 'bottom-right')
        setWelcomeMessage(data.welcome_message || '')
        setOfflineMessage(data.offline_message || '')
        setRequireEmail(data.require_email ?? true)
        setCollectName(data.collect_name ?? true)
        setIsActive(data.is_active ?? true)
        setAllowedOrigins((data.allowed_origins || []).join('\n'))
      }
      setIsLoading(false)
    }
    load()
  }, [resolvedParams.widgetId])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const origins = allowedOrigins
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0)

    const { error } = await adminUpdateWidget(resolvedParams.widgetId, {
      name,
      primaryColor,
      position,
      welcomeMessage,
      offlineMessage,
      requireEmail,
      collectName,
      isActive,
      allowedOrigins: origins,
    })

    if (error) {
      setError(error)
    } else {
      const { data } = await getAdminWidget(resolvedParams.widgetId)
      if (data) setWidget(data)
    }
    setIsSaving(false)
  }

  const copyEmbedCode = () => {
    if (!widget) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const embedCode = `<script src="${baseUrl}/widget/loader.js"></script>
<script>
  ChatWidget.init({
    embedToken: '${widget.embed_token}'
  });
</script>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateToken = async () => {
    setIsRegenerating(true)
    setError(null)
    const { error } = await adminRegenerateWidgetToken(resolvedParams.widgetId)
    if (error) {
      setError(error)
    } else {
      const { data } = await getAdminWidget(resolvedParams.widgetId)
      if (data) setWidget(data)
    }
    setIsRegenerating(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const { error } = await adminDeleteWidget(resolvedParams.widgetId)
    if (error) {
      setError(error)
      setIsDeleting(false)
    } else {
      router.push(workspaceUrl)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
      </div>
    )
  }

  if (!widget) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Widget not found'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={workspaceUrl}>Back to Workspace</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={workspaceUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{widget.name}</h2>
          <p className="text-muted-foreground">
            Admin widget configuration
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </div>
          <p className="mt-1 text-2xl font-bold">{widget.conversation_count}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code className="h-4 w-4" />
            Status
          </div>
          <div className="mt-1">
            <Badge variant={widget.is_active ? 'default' : 'secondary'}>
              {widget.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Created
          </div>
          <p className="mt-1 text-sm font-medium">
            {widget.created_at ? new Date(widget.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Embed Code</h3>
            <p className="text-sm text-muted-foreground">
              Add this code to your website to display the chat widget.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/widget?token=${widget.embed_token}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              {copied ? (
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
            <TooltipProvider>
              <Tooltip>
                <AlertDialog>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isRegenerating}>
                        <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Regenerate Token</p>
                  </TooltipContent>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate Embed Token?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately invalidate the current embed token. Any websites using the
                        current embed code will no longer be able to load the chat widget until they
                        update to the new embed code.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerateToken}>
                        Regenerate Token
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
          <code>{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/loader.js"></script>
<script>
  ChatWidget.init({
    embedToken: '${widget.embed_token}'
  });
</script>`}</code>
        </pre>
      </div>

      {/* General Settings */}
      <div className="rounded-lg border p-6 space-y-6">
        <h3 className="font-medium">General Settings</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Widget Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Widget"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={position} onValueChange={(v) => setPosition(v as 'bottom-right' | 'bottom-left')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#2f8fff"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Widget Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the widget
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-lg border p-6 space-y-6">
        <h3 className="font-medium">Messages</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome">Welcome Message</Label>
            <Textarea
              id="welcome"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Hi! How can we help you today?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offline">Offline Message</Label>
            <Textarea
              id="offline"
              value={offlineMessage}
              onChange={(e) => setOfflineMessage(e.target.value)}
              placeholder="We're currently offline. Leave a message and we'll get back to you!"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Visitor Settings */}
      <div className="rounded-lg border p-6 space-y-6">
        <h3 className="font-medium">Visitor Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Email</Label>
              <p className="text-sm text-muted-foreground">
                Visitors must provide their email before chatting
              </p>
            </div>
            <Switch checked={requireEmail} onCheckedChange={setRequireEmail} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Collect Name</Label>
              <p className="text-sm text-muted-foreground">
                Ask visitors for their name
              </p>
            </div>
            <Switch checked={collectName} onCheckedChange={setCollectName} />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-lg border p-6 space-y-6">
        <h3 className="font-medium">Security</h3>
        <div className="space-y-2">
          <Label htmlFor="origins">Allowed Origins</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Restrict which domains can embed this widget. Leave empty to allow all domains.
            Enter one domain per line (e.g., https://example.com).
          </p>
          <Textarea
            id="origins"
            value={allowedOrigins}
            onChange={(e) => setAllowedOrigins(e.target.value)}
            placeholder={"https://example.com\nhttps://www.example.com"}
            rows={3}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={workspaceUrl}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/50 p-6 space-y-4">
        <h3 className="font-medium text-destructive">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete Widget</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this widget and all its conversations.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Widget'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Widget?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the widget &quot;{widget.name}&quot; and all associated
                  conversations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Widget
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
