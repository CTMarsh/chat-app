'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { usePreferences } from '@/components/providers/preferences-provider'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

type SavingField = 'displayName' | 'username' | 'bio' | null

export default function ProfileSettingsPage() {
  const supabase = createClient()
  const { preferences, updatePreference } = usePreferences()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingField, setSavingField] = useState<SavingField>(null)
  const [savedField, setSavedField] = useState<SavingField>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Track original values to detect changes
  const [originalDisplayName, setOriginalDisplayName] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [originalBio, setOriginalBio] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setUsername(data.username)
        setOriginalDisplayName(data.display_name || '')
        setOriginalUsername(data.username)
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [supabase])

  useEffect(() => {
    if (preferences?.bio !== undefined) {
      setBio(preferences.bio || '')
      setOriginalBio(preferences.bio || '')
    }
  }, [preferences])

  // Show saved indicator briefly
  const showSaved = useCallback((field: SavingField) => {
    setSavedField(field)
    setTimeout(() => setSavedField(null), 2000)
  }, [])

  // Auto-save display name on blur
  const handleDisplayNameBlur = async () => {
    if (!profile || displayName === originalDisplayName) return

    setSavingField('displayName')
    setError(null)

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', profile.id)

    setSavingField(null)

    if (error) {
      setError(error.message)
      return
    }

    setOriginalDisplayName(displayName)
    setProfile(prev => prev ? { ...prev, display_name: displayName } : null)
    showSaved('displayName')
  }

  // Auto-save username on blur
  const handleUsernameBlur = async () => {
    if (!profile || username === originalUsername || !username.trim()) return

    setSavingField('username')
    setError(null)

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', profile.id)

    setSavingField(null)

    if (error) {
      setError(error.message)
      return
    }

    setOriginalUsername(username)
    setProfile(prev => prev ? { ...prev, username } : null)
    showSaved('username')
  }

  // Auto-save bio on blur
  const handleBioBlur = async () => {
    if (bio === originalBio) return

    setSavingField('bio')
    setError(null)

    const result = await updatePreference('bio', bio.trim() || null)

    setSavingField(null)

    if (result.error) {
      setError(result.error)
      return
    }

    setOriginalBio(bio)
    showSaved('bio')
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Inline saving/saved indicator
  const FieldStatus = ({ field }: { field: SavingField }) => {
    if (savingField === field) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
    if (savedField === field) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage how others see you in the app
        </p>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Avatar Card */}
        <SettingSection title="Avatar" description="Your profile picture" accent>
          <div className="flex flex-col items-center py-4">
            <AvatarUpload
              userId={profile?.id || ''}
              currentUrl={profile?.avatar_url || null}
              fallback={getInitials(profile?.display_name || profile?.username)}
              onUpload={(url) => {
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null)
              }}
            />
          </div>
        </SettingSection>

        {/* Display Name Card */}
        <SettingSection title="Display Name" description="How your name appears">
          <div className="space-y-3">
            <div className="relative">
              <Input
                id="display-name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={handleDisplayNameBlur}
                placeholder="Enter your display name"
                className={cn(
                  "pr-8",
                  displayName !== originalDisplayName && "border-primary/50"
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <FieldStatus field="displayName" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is visible to everyone
            </p>
          </div>
        </SettingSection>

        {/* Username Card */}
        <SettingSection title="Username" description="Your unique identifier">
          <div className="space-y-3">
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={handleUsernameBlur}
                placeholder="Enter your username"
                className={cn(
                  "pr-8",
                  username !== originalUsername && "border-primary/50"
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <FieldStatus field="username" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Others can find you with this
            </p>
          </div>
        </SettingSection>

        {/* Bio Card - spans 2 columns on large screens */}
        <SettingSection title="Bio" description="Tell others about yourself" className="lg:col-span-2">
          <div className="space-y-3">
            <div className="relative">
              <textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                onBlur={handleBioBlur}
                placeholder="Write a short bio..."
                className={cn(
                  "flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-8",
                  bio !== originalBio && "border-primary/50"
                )}
                maxLength={160}
              />
              <div className="absolute right-2 top-2">
                <FieldStatus field="bio" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {bio.length}/160 characters
            </p>
          </div>
        </SettingSection>

        {/* Status Card */}
        <SettingSection title="Status" description="Your online presence">
          <SettingRow
            label="Online Status"
            description="How you appear to others"
          >
            <Select
              value={preferences?.online_status_preference || 'online'}
              onValueChange={(value) =>
                updatePreference('online_status_preference', value as 'online' | 'away' | 'dnd' | 'invisible')
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="dnd">Do Not Disturb</SelectItem>
                <SelectItem value="invisible">Invisible</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  )
}
