'use client'

import { useState, useEffect, useRef, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getWidget, updateWidget, regenerateEmbedToken } from '@/lib/actions/widgets'
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
import type { WidgetWithWorkspace } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ widgetId: string }>
}

export default function WidgetConfigPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [widget, setWidget] = useState<WidgetWithWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [offlineMessage, setOfflineMessage] = useState('')
  const [requireEmail, setRequireEmail] = useState(true)
  const [collectName, setCollectName] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [allowedOrigins, setAllowedOrigins] = useState('')

  // Track original values for dirty state detection
  const originalValuesRef = useRef<Record<string, unknown>>({})

  const isDirty = useMemo(() => {
    const orig = originalValuesRef.current
    if (!Object.keys(orig).length) return false
    return (
      name !== orig.name ||
      primaryColor !== orig.primaryColor ||
      position !== orig.position ||
      welcomeMessage !== orig.welcomeMessage ||
      offlineMessage !== orig.offlineMessage ||
      requireEmail !== orig.requireEmail ||
      collectName !== orig.collectName ||
      isActive !== orig.isActive ||
      allowedOrigins !== orig.allowedOrigins
    )
  }, [name, primaryColor, position, welcomeMessage, offlineMessage, requireEmail, collectName, isActive, allowedOrigins])

  const resetForm = () => {
    const orig = originalValuesRef.current
    setName(orig.name as string)
    setPrimaryColor(orig.primaryColor as string)
    setPosition(orig.position as 'bottom-right' | 'bottom-left')
    setWelcomeMessage(orig.welcomeMessage as string)
    setOfflineMessage(orig.offlineMessage as string)
    setRequireEmail(orig.requireEmail as boolean)
    setCollectName(orig.collectName as boolean)
    setIsActive(orig.isActive as boolean)
    setAllowedOrigins(orig.allowedOrigins as string)
  }

  // Navigation guard for unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault() }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => {
    const loadWidget = async () => {
      setIsLoading(true)
      const { data, error } = await getWidget(resolvedParams.widgetId)

      if (error) {
        setError(error)
      } else if (data) {
        setWidget(data)
        const formValues = {
          name: data.name,
          primaryColor: data.primary_color || '#6366f1',
          position: (data.position as 'bottom-right' | 'bottom-left') || 'bottom-right',
          welcomeMessage: data.welcome_message || '',
          offlineMessage: data.offline_message || '',
          requireEmail: data.require_email ?? true,
          collectName: data.collect_name ?? true,
          isActive: data.is_active ?? true,
          allowedOrigins: (data.allowed_origins || []).join('\n'),
        }
        setName(formValues.name)
        setPrimaryColor(formValues.primaryColor)
        setPosition(formValues.position)
        setWelcomeMessage(formValues.welcomeMessage)
        setOfflineMessage(formValues.offlineMessage)
        setRequireEmail(formValues.requireEmail)
        setCollectName(formValues.collectName)
        setIsActive(formValues.isActive)
        setAllowedOrigins(formValues.allowedOrigins)
        originalValuesRef.current = formValues
      }

      setIsLoading(false)
    }

    loadWidget()
  }, [resolvedParams.widgetId])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const origins = allowedOrigins
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0)

    const { error } = await updateWidget(resolvedParams.widgetId, {
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
      // Refresh widget data and update original values
      const { data } = await getWidget(resolvedParams.widgetId)
      if (data) {
        setWidget(data)
        originalValuesRef.current = {
          name, primaryColor, position, welcomeMessage, offlineMessage,
          requireEmail, collectName, isActive, allowedOrigins: origins.join('\n'),
        }
      }
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

    const { data, error } = await regenerateEmbedToken(resolvedParams.widgetId)

    if (error) {
      setError(error)
    } else if (data) {
      // Refresh widget data to get the new token
      const { data: refreshedWidget } = await getWidget(resolvedParams.widgetId)
      if (refreshedWidget) {
        setWidget(refreshedWidget)
      }
    }

    setIsRegenerating(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!widget) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Widget not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/chat/settings/widgets">Back to Widgets</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat/settings/widgets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{widget.name}</h2>
          <p className="text-muted-foreground">
            Configure your widget settings and appearance.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isDirty && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2">
          <span className="text-sm text-amber-700 dark:text-amber-400">You have unsaved changes</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={resetForm}>Discard</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

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
                placeholder="#6366f1"
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
            placeholder="https://example.com&#10;https://www.example.com"
            rows={3}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/chat/settings/widgets">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
