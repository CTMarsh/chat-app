'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Camera, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { MFAEnroll } from '@/components/auth/mfa-enroll'
import { MFAUnenroll } from '@/components/auth/mfa-unenroll'
import type { Profile } from '@/lib/types/database'

interface MFAFactor {
  id: string
  friendly_name?: string
  status: string
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // MFA state
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([])
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [unenrollOpen, setUnenrollOpen] = useState(false)
  const [selectedFactorId, setSelectedFactorId] = useState('')

  const fetchMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error && data) {
      const verifiedFactors = data.totp.filter(f => f.status === 'verified')
      setMfaFactors(verifiedFactors)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setUsername(data.username)
      }

      await fetchMFAFactors()
      setIsLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        username: username.trim(),
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setProfile(prev => prev ? { ...prev, display_name: displayName, username } : null)
    }

    setIsSaving(false)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {getInitials(profile?.display_name || profile?.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avatar changes are not supported yet
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your username"
              />
              <p className="text-xs text-muted-foreground">
                This is your unique identifier. Others can find you by your username.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* MFA Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaFactors.length > 0 ? (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Two-factor authentication is enabled
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your account is protected with an authenticator app
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {mfaFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {factor.friendly_name || 'Authenticator App'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFactorId(factor.id)
                          setUnenrollOpen(true)
                        }}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <ShieldOff className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Two-factor authentication is not enabled
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      We recommend enabling 2FA to secure your account
                    </p>
                  </div>
                </div>

                <Button onClick={() => setEnrollOpen(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* MFA Dialogs */}
        <MFAEnroll
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
          onEnrolled={() => {
            fetchMFAFactors()
            setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully' })
          }}
        />

        <MFAUnenroll
          open={unenrollOpen}
          onOpenChange={setUnenrollOpen}
          factorId={selectedFactorId}
          onUnenrolled={() => {
            fetchMFAFactors()
            setMessage({ type: 'success', text: 'Two-factor authentication disabled' })
          }}
        />
      </main>
    </div>
  )
}
