'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import { ColorPicker } from '@/components/settings/color-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppearancePreferences } from '@/components/providers/preferences-provider'
import { cn } from '@/lib/utils'

export default function AppearanceSettingsPage() {
  const { theme, setTheme: setNextTheme } = useTheme()
  const {
    uiScale,
    fontSize,
    accentColor,
    messageDensity,
    setTheme,
    setUiScale,
    setFontSize,
    setAccentColor,
    setMessageDensity,
  } = useAppearancePreferences()

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setNextTheme(newTheme)
    await setTheme(newTheme)
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="mt-2 text-muted-foreground">
          Customize how the app looks and feels
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Theme Cards - each theme is its own card */}
        <SettingSection title="Light Theme" description="Bright and clean" accent={theme === 'light'}>
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={cn(
              'flex w-full flex-col items-center gap-4 rounded-xl border-2 p-6 transition-all duration-200',
              theme === 'light'
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-transparent bg-muted/50 hover:bg-muted hover:border-border'
            )}
          >
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200',
              'bg-gradient-to-br from-amber-100 to-orange-100',
              theme === 'light' && 'scale-110 shadow-lg'
            )}>
              <Sun className="h-8 w-8 text-amber-600" />
            </div>
            <span className="font-medium">{theme === 'light' ? 'Active' : 'Select'}</span>
          </button>
        </SettingSection>

        <SettingSection title="Dark Theme" description="Easy on the eyes" accent={theme === 'dark'}>
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'flex w-full flex-col items-center gap-4 rounded-xl border-2 p-6 transition-all duration-200',
              theme === 'dark'
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-transparent bg-muted/50 hover:bg-muted hover:border-border'
            )}
          >
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200',
              'bg-gradient-to-br from-slate-700 to-slate-900',
              theme === 'dark' && 'scale-110 shadow-lg'
            )}>
              <Moon className="h-8 w-8 text-slate-300" />
            </div>
            <span className="font-medium">{theme === 'dark' ? 'Active' : 'Select'}</span>
          </button>
        </SettingSection>

        <SettingSection title="System Theme" description="Match your device" accent={theme === 'system'}>
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={cn(
              'flex w-full flex-col items-center gap-4 rounded-xl border-2 p-6 transition-all duration-200',
              theme === 'system'
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-transparent bg-muted/50 hover:bg-muted hover:border-border'
            )}
          >
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200',
              'bg-gradient-to-br from-amber-100 to-slate-800',
              theme === 'system' && 'scale-110 shadow-lg'
            )}>
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <span className="font-medium">{theme === 'system' ? 'Active' : 'Select'}</span>
          </button>
        </SettingSection>

        {/* UI Scale */}
        <SettingSection title="UI Scale" description="Spacing and sizing">
          <SettingRow label="Scale" description="Overall interface density">
            <Select
              value={uiScale}
              onValueChange={(value) => setUiScale(value as 'compact' | 'comfortable' | 'spacious')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>

        {/* Font Size */}
        <SettingSection title="Font Size" description="Text readability">
          <SettingRow label="Size" description="Base text size">
            <Select
              value={fontSize}
              onValueChange={(value) => setFontSize(value as 'small' | 'medium' | 'large')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>

        {/* Message Density */}
        <SettingSection title="Messages" description="Chat layout">
          <SettingRow label="Density" description="Message spacing">
            <Select
              value={messageDensity}
              onValueChange={(value) => setMessageDensity(value as 'compact' | 'default' | 'relaxed')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>

        {/* Accent Color */}
        <SettingSection title="Accent Color" description="Personalize highlights">
          <SettingRow label="Color" description="Buttons and links">
            <ColorPicker value={accentColor} onChange={setAccentColor} />
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  )
}
