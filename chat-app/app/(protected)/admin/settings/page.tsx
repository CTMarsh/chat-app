'use client'

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import { getPlatformSettings, updatePlatformSetting } from '@/lib/actions/admin'

type PlatformSetting = {
  key: string
  value: string
  description: string | null
  updated_at: string
}

const SETTING_LABELS: Record<string, { label: string; description: string; type: 'number' | 'boolean' }> = {
  max_workspace_members: { label: 'Max Workspace Members', description: 'Maximum members per workspace', type: 'number' },
  max_workspaces_per_user: { label: 'Max Workspaces Per User', description: 'Maximum workspaces a user can own', type: 'number' },
  max_file_size_mb: { label: 'Max File Size (MB)', description: 'Maximum upload file size in megabytes', type: 'number' },
  max_widgets_per_workspace: { label: 'Max Widgets Per Workspace', description: 'Maximum widgets per workspace', type: 'number' },
  allow_signups: { label: 'Allow Signups', description: 'Whether new user registration is enabled', type: 'boolean' },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getPlatformSettings()
      if (data) {
        setSettings(data)
        const values: Record<string, string> = {}
        data.forEach(s => { values[s.key] = s.value })
        setEditedValues(values)
      }
      if (error) setError(error)
      setIsLoading(false)
    }
    load()
  }, [])

  const handleSave = async (key: string) => {
    const original = settings.find(s => s.key === key)
    if (!original || editedValues[key] === original.value) return

    setSavingKey(key)
    setError(null)

    const { error } = await updatePlatformSetting(key, editedValues[key])

    if (error) {
      setError(error)
    } else {
      // Update local state
      setSettings(prev => prev.map(s =>
        s.key === key ? { ...s, value: editedValues[key], updated_at: new Date().toISOString() } : s
      ))
    }

    setSavingKey(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-crit" />
      </div>
    )
  }

  // Group settings by type
  const limitSettings = settings.filter(s => SETTING_LABELS[s.key]?.type === 'number')
  const featureSettings = settings.filter(s => SETTING_LABELS[s.key]?.type === 'boolean')
  const otherSettings = settings.filter(s => !SETTING_LABELS[s.key])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">
          Configure platform-wide limits and features.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Limits */}
        {limitSettings.length > 0 && (
          <SettingSection title="Limits" description="Platform resource limits">
            {limitSettings.map((setting) => {
              const info = SETTING_LABELS[setting.key]
              const hasChanged = editedValues[setting.key] !== setting.value

              return (
                <SettingRow
                  key={setting.key}
                  label={info?.label || setting.key}
                  description={info?.description || setting.description || undefined}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editedValues[setting.key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [setting.key]: e.target.value,
                      }))}
                      className="w-24"
                    />
                    {hasChanged && (
                      <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        disabled={savingKey === setting.key}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </SettingRow>
              )
            })}
          </SettingSection>
        )}

        {/* Features */}
        {featureSettings.length > 0 && (
          <SettingSection title="Features" description="Platform feature toggles">
            {featureSettings.map((setting) => {
              const info = SETTING_LABELS[setting.key]
              const isEnabled = editedValues[setting.key] === 'true'

              return (
                <SettingRow
                  key={setting.key}
                  label={info?.label || setting.key}
                  description={info?.description || setting.description || undefined}
                >
                  <Button
                    variant={isEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={async () => {
                      const newValue = isEnabled ? 'false' : 'true'
                      setEditedValues(prev => ({ ...prev, [setting.key]: newValue }))
                      setSavingKey(setting.key)
                      const { error } = await updatePlatformSetting(setting.key, newValue)
                      if (error) setError(error)
                      else {
                        setSettings(prev => prev.map(s =>
                          s.key === setting.key ? { ...s, value: newValue, updated_at: new Date().toISOString() } : s
                        ))
                      }
                      setSavingKey(null)
                    }}
                    disabled={savingKey === setting.key}
                  >
                    {savingKey === setting.key ? 'Saving...' : isEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </SettingRow>
              )
            })}
          </SettingSection>
        )}

        {/* Other/custom settings */}
        {otherSettings.length > 0 && (
          <SettingSection title="Other" description="Custom settings">
            {otherSettings.map((setting) => {
              const hasChanged = editedValues[setting.key] !== setting.value

              return (
                <SettingRow
                  key={setting.key}
                  label={setting.key}
                  description={setting.description || undefined}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedValues[setting.key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [setting.key]: e.target.value,
                      }))}
                      className="w-32"
                    />
                    {hasChanged && (
                      <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        disabled={savingKey === setting.key}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </SettingRow>
              )
            })}
          </SettingSection>
        )}
      </div>
    </div>
  )
}
