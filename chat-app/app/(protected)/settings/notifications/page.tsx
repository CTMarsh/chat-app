'use client'

import { Bell, BellOff, Volume2, Moon } from 'lucide-react'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNotificationPreferences } from '@/components/providers/preferences-provider'

export default function NotificationsSettingsPage() {
  const {
    desktopNotifications,
    soundNotifications,
    dndEnabled,
    dndStartTime,
    dndEndTime,
    setDesktopNotifications,
    setSoundNotifications,
    setDndEnabled,
    setDndSchedule,
  } = useNotificationPreferences()

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return
      }
    }
    setDesktopNotifications(enabled)
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Desktop Notifications */}
        <SettingSection title="Desktop" description="System notifications">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Desktop Alerts</p>
              <p className="text-xs text-muted-foreground">Show system notifications</p>
            </div>
            <Switch
              checked={desktopNotifications}
              onCheckedChange={handleDesktopNotificationsChange}
            />
          </div>
        </SettingSection>

        {/* Sound Notifications */}
        <SettingSection title="Sound" description="Audio alerts">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Volume2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Sound Effects</p>
              <p className="text-xs text-muted-foreground">Play sounds for messages</p>
            </div>
            <Switch
              checked={soundNotifications}
              onCheckedChange={setSoundNotifications}
            />
          </div>
        </SettingSection>

        {/* Do Not Disturb - spans 2 columns */}
        <SettingSection
          title="Do Not Disturb"
          description="Quiet hours"
          className="lg:col-span-1"
        >
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <BellOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Enable DND</p>
              <p className="text-xs text-muted-foreground">Silence all notifications</p>
            </div>
            <Switch checked={dndEnabled} onCheckedChange={setDndEnabled} />
          </div>
        </SettingSection>

        {/* DND Schedule */}
        {dndEnabled && (
          <SettingSection
            title="Schedule"
            description="Set quiet hours"
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-4 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Moon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quiet Hours</p>
                <p className="text-xs text-muted-foreground">Notifications silenced during this time</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dnd-start" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="dnd-start"
                  type="time"
                  value={dndStartTime || '22:00'}
                  onChange={(e) => setDndSchedule(e.target.value, dndEndTime)}
                  className="w-[130px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dnd-end" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="dnd-end"
                  type="time"
                  value={dndEndTime || '08:00'}
                  onChange={(e) => setDndSchedule(dndStartTime, e.target.value)}
                  className="w-[130px]"
                />
              </div>
            </div>
          </SettingSection>
        )}
      </div>
    </div>
  )
}
