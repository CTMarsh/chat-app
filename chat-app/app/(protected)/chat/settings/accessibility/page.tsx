'use client'

import { Eye, Sparkles, Zap, Contrast } from 'lucide-react'
import { SettingSection } from '@/components/settings/setting-section'
import { Switch } from '@/components/ui/switch'
import { useAccessibilityPreferences } from '@/components/providers/preferences-provider'

export default function AccessibilitySettingsPage() {
  const {
    reduceMotion,
    highContrast,
    setReduceMotion,
    setHighContrast,
  } = useAccessibilityPreferences()

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accessibility</h1>
        <p className="mt-2 text-muted-foreground">
          Make the app easier to use for your needs
        </p>
      </div>

      {/* Responsive grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Reduce Motion */}
        <SettingSection title="Motion" description="Control animations">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Reduce Motion</p>
              <p className="text-xs text-muted-foreground">Minimize animations</p>
            </div>
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </div>

          {reduceMotion && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 mt-4">
              <Sparkles className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Animations disabled</p>
                <p className="text-xs text-muted-foreground">
                  All animations and transitions have been minimized.
                </p>
              </div>
            </div>
          )}
        </SettingSection>

        {/* High Contrast */}
        <SettingSection title="Vision" description="Improve visibility">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Contrast className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">High Contrast</p>
              <p className="text-xs text-muted-foreground">Increase visibility</p>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>

          {highContrast && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 mt-4">
              <Eye className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">High contrast enabled</p>
                <p className="text-xs text-muted-foreground">
                  Borders and text have been enhanced.
                </p>
              </div>
            </div>
          )}
        </SettingSection>
      </div>
    </div>
  )
}
