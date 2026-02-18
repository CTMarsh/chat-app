'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { getPreferences, updatePreferences } from '@/lib/actions/settings'
import type { UserPreferences } from '@/lib/types/database'

type PreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

interface PreferencesContextType {
  preferences: UserPreferences | null
  isLoading: boolean
  updatePreference: <K extends keyof PreferencesUpdate>(
    key: K,
    value: PreferencesUpdate[K]
  ) => Promise<{ error: string | null }>
  updateMultiplePreferences: (
    updates: PreferencesUpdate
  ) => Promise<{ error: string | null }>
  refreshPreferences: () => Promise<void>
}

const PreferencesContext = React.createContext<PreferencesContextType | undefined>(undefined)

export function usePreferences() {
  const context = React.useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

interface PreferencesProviderProps {
  children: React.ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { setTheme } = useTheme()

  // Fetch preferences on mount
  const fetchPreferences = React.useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await getPreferences()
    if (!error && data) {
      setPreferences(data)
    }
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  // Apply preferences to DOM
  React.useEffect(() => {
    if (!preferences) return

    const root = document.documentElement

    // Theme - sync with next-themes
    if (preferences.theme) {
      setTheme(preferences.theme)
    }

    // UI Scale
    root.setAttribute('data-ui-scale', preferences.ui_scale)

    // Font Size
    root.setAttribute('data-font-size', preferences.font_size)

    // Message Density
    root.setAttribute('data-message-density', preferences.message_density)

    // Accent Color - set CSS variable and data attribute
    if (preferences.accent_color && preferences.accent_color !== '#4A8BC2') {
      root.style.setProperty('--user-accent-color', preferences.accent_color)
      root.setAttribute('data-accent-color', 'custom')
    } else {
      root.style.removeProperty('--user-accent-color')
      root.removeAttribute('data-accent-color')
    }

    // Accessibility: Reduce Motion
    if (preferences.reduce_motion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Accessibility: High Contrast
    if (preferences.high_contrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [preferences, setTheme])

  // Update a single preference
  const updatePreference = React.useCallback(
    async <K extends keyof PreferencesUpdate>(
      key: K,
      value: PreferencesUpdate[K]
    ): Promise<{ error: string | null }> => {
      // Optimistic update
      setPreferences((prev) => {
        if (!prev) return prev
        return { ...prev, [key]: value }
      })

      const result = await updatePreferences({ [key]: value } as PreferencesUpdate)

      if (result.error) {
        // Revert on error
        await fetchPreferences()
      }

      return result
    },
    [fetchPreferences]
  )

  // Update multiple preferences at once
  const updateMultiplePreferences = React.useCallback(
    async (updates: PreferencesUpdate): Promise<{ error: string | null }> => {
      // Optimistic update
      setPreferences((prev) => {
        if (!prev) return prev
        return { ...prev, ...updates }
      })

      const result = await updatePreferences(updates)

      if (result.error) {
        // Revert on error
        await fetchPreferences()
      }

      return result
    },
    [fetchPreferences]
  )

  const value = React.useMemo(
    () => ({
      preferences,
      isLoading,
      updatePreference,
      updateMultiplePreferences,
      refreshPreferences: fetchPreferences,
    }),
    [preferences, isLoading, updatePreference, updateMultiplePreferences, fetchPreferences]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

// Convenience hooks for specific preference categories
export function useAppearancePreferences() {
  const { preferences, updatePreference } = usePreferences()
  return {
    theme: preferences?.theme ?? 'system',
    uiScale: preferences?.ui_scale ?? 'comfortable',
    fontSize: preferences?.font_size ?? 'medium',
    accentColor: preferences?.accent_color ?? '#4A8BC2',
    messageDensity: preferences?.message_density ?? 'default',
    setTheme: (theme: UserPreferences['theme']) => updatePreference('theme', theme),
    setUiScale: (scale: UserPreferences['ui_scale']) => updatePreference('ui_scale', scale),
    setFontSize: (size: UserPreferences['font_size']) => updatePreference('font_size', size),
    setAccentColor: (color: string) => updatePreference('accent_color', color),
    setMessageDensity: (density: UserPreferences['message_density']) =>
      updatePreference('message_density', density),
  }
}

export function useMessagePreferences() {
  const { preferences, updatePreference } = usePreferences()
  return {
    enterKeyBehavior: preferences?.enter_key_behavior ?? 'send',
    linkPreviewsEnabled: preferences?.link_previews_enabled ?? true,
    sendTypingIndicators: preferences?.send_typing_indicators ?? true,
    sendReadReceipts: preferences?.send_read_receipts ?? true,
    emojiSkinTone: preferences?.emoji_skin_tone ?? 'default',
    setEnterKeyBehavior: (behavior: UserPreferences['enter_key_behavior']) =>
      updatePreference('enter_key_behavior', behavior),
    setLinkPreviewsEnabled: (enabled: boolean) =>
      updatePreference('link_previews_enabled', enabled),
    setSendTypingIndicators: (enabled: boolean) =>
      updatePreference('send_typing_indicators', enabled),
    setSendReadReceipts: (enabled: boolean) =>
      updatePreference('send_read_receipts', enabled),
    setEmojiSkinTone: (tone: UserPreferences['emoji_skin_tone']) =>
      updatePreference('emoji_skin_tone', tone),
  }
}

export function useNotificationPreferences() {
  const { preferences, updatePreference, updateMultiplePreferences } = usePreferences()
  return {
    desktopNotifications: preferences?.desktop_notifications ?? true,
    soundNotifications: preferences?.sound_notifications ?? true,
    dndEnabled: preferences?.dnd_enabled ?? false,
    dndStartTime: preferences?.dnd_start_time ?? null,
    dndEndTime: preferences?.dnd_end_time ?? null,
    setDesktopNotifications: (enabled: boolean) =>
      updatePreference('desktop_notifications', enabled),
    setSoundNotifications: (enabled: boolean) =>
      updatePreference('sound_notifications', enabled),
    setDndEnabled: (enabled: boolean) => updatePreference('dnd_enabled', enabled),
    setDndSchedule: (startTime: string | null, endTime: string | null) =>
      updateMultiplePreferences({ dnd_start_time: startTime, dnd_end_time: endTime }),
  }
}

export function usePrivacyPreferences() {
  const { preferences, updatePreference } = usePreferences()
  return {
    showOnlineStatus: preferences?.show_online_status ?? true,
    showReadReceipts: preferences?.show_read_receipts ?? true,
    showTypingIndicator: preferences?.show_typing_indicator ?? true,
    setShowOnlineStatus: (show: boolean) => updatePreference('show_online_status', show),
    setShowReadReceipts: (show: boolean) => updatePreference('show_read_receipts', show),
    setShowTypingIndicator: (show: boolean) =>
      updatePreference('show_typing_indicator', show),
  }
}

export function useAccessibilityPreferences() {
  const { preferences, updatePreference } = usePreferences()
  return {
    reduceMotion: preferences?.reduce_motion ?? false,
    highContrast: preferences?.high_contrast ?? false,
    setReduceMotion: (enabled: boolean) => updatePreference('reduce_motion', enabled),
    setHighContrast: (enabled: boolean) => updatePreference('high_contrast', enabled),
  }
}
