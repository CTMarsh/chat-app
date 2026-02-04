'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  LogOut,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingSection } from '@/components/settings/setting-section'
import { createClient } from '@/lib/supabase/client'
import { MFAEnroll } from '@/components/auth/mfa-enroll'
import { MFAUnenroll } from '@/components/auth/mfa-unenroll'
import {
  signOutAllDevices,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  trackSession,
  type UserSession
} from '@/lib/actions/settings'
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
import { Smartphone, Laptop, Globe, X } from 'lucide-react'

interface MFAFactor {
  id: string
  friendly_name?: string
  status: string
}

// Helper to parse user agent and get device info
function parseUserAgent(userAgent: string | null): { device: string; icon: typeof Laptop } {
  if (!userAgent) return { device: 'Unknown Device', icon: Globe }

  const ua = userAgent.toLowerCase()

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { device: 'Mobile Device', icon: Smartphone }
  }

  if (ua.includes('windows')) {
    return { device: 'Windows', icon: Laptop }
  }
  if (ua.includes('mac')) {
    return { device: 'Mac', icon: Laptop }
  }
  if (ua.includes('linux')) {
    return { device: 'Linux', icon: Laptop }
  }

  return { device: 'Browser', icon: Globe }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function SecuritySettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [unenrollOpen, setUnenrollOpen] = useState(false)
  const [selectedFactorId, setSelectedFactorId] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isRevokingSession, setIsRevokingSession] = useState<string | null>(null)
  const [isRevokingOthers, setIsRevokingOthers] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fetchMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error && data) {
      const verifiedFactors = data.totp.filter((f) => f.status === 'verified')
      setMfaFactors(verifiedFactors)
    }
  }

  const fetchSessions = async () => {
    const { data } = await getActiveSessions()
    setSessions(data)
  }

  useEffect(() => {
    const loadData = async () => {
      // Track current session on page load
      await trackSession(navigator.userAgent)
      await Promise.all([fetchMFAFactors(), fetchSessions()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevokingSession(sessionId)
    const { error } = await revokeSession(sessionId)
    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: 'Session revoked successfully' })
      await fetchSessions()
    }
    setIsRevokingSession(null)
  }

  const handleRevokeOtherSessions = async () => {
    setIsRevokingOthers(true)
    const { count, error } = await revokeOtherSessions()
    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: `${count} other session(s) revoked` })
      await fetchSessions()
    }
    setIsRevokingOthers(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSignOutAll = async () => {
    setIsSigningOut(true)
    const { error } = await signOutAllDevices()
    if (error) {
      setMessage({ type: 'error', text: error })
      setIsSigningOut(false)
    } else {
      router.push('/login')
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account security settings
        </p>
      </div>

      {/* Responsive grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* MFA Status Card */}
        <SettingSection
          title="Two-Factor Authentication"
          description="Extra layer of security"
          accent
        >
          {mfaFactors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    2FA Enabled
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your account is protected
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <ShieldOff className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    2FA Not Enabled
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Protect your account now
                  </p>
                </div>
              </div>
              <Button onClick={() => setEnrollOpen(true)} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            </div>
          )}
        </SettingSection>

        {/* MFA Methods Card - only show if enabled */}
        {mfaFactors.length > 0 && (
          <SettingSection
            title="Authentication Methods"
            description="Manage your 2FA devices"
            className="xl:col-span-2"
          >
            <div className="space-y-3">
              {mfaFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">
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
          </SettingSection>
        )}

        {/* Active Sessions Card */}
        <SettingSection
          title="Active Sessions"
          description="Manage logged-in devices"
          className={mfaFactors.length === 0 ? 'lg:col-span-2 xl:col-span-2' : 'xl:col-span-2'}
        >
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const { device, icon: DeviceIcon } = parseUserAgent(session.user_agent)
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      session.is_current ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        session.is_current ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                      }`}>
                        <DeviceIcon className={`h-5 w-5 ${
                          session.is_current ? 'text-green-600' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{device}</p>
                          {session.is_current && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Active {formatRelativeTime(session.last_active_at)}
                          {session.ip_address && ` • ${session.ip_address}`}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isRevokingSession === session.id}
                          >
                            {isRevokingSession === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately sign out this device. The user will need to sign in again to access their account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeSession(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )
              })}

              {/* Revoke Other Sessions Button */}
              {sessions.filter(s => !s.is_current).length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      disabled={isRevokingOthers}
                    >
                      {isRevokingOthers ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Sign Out Other Devices
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign Out Other Devices?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will sign out all other devices except your current session.
                        {sessions.filter(s => !s.is_current).length} session(s) will be revoked.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeOtherSessions}>
                        Sign Out Other Devices
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </SettingSection>

        {/* Sign Out Card - full width */}
        <SettingSection
          title="Sign Out"
          description="End your session"
          className="lg:col-span-3 xl:col-span-4"
        >
          {message && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleSignOut} size="lg">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOutAll}
              disabled={isSigningOut}
              size="lg"
            >
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out All Devices
            </Button>
          </div>
        </SettingSection>
      </div>

      {/* MFA Dialogs */}
      <MFAEnroll
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrolled={() => {
          fetchMFAFactors()
          setMessage({
            type: 'success',
            text: 'Two-factor authentication enabled successfully',
          })
        }}
      />

      <MFAUnenroll
        open={unenrollOpen}
        onOpenChange={setUnenrollOpen}
        factorId={selectedFactorId}
        onUnenrolled={() => {
          fetchMFAFactors()
          setMessage({
            type: 'success',
            text: 'Two-factor authentication disabled',
          })
        }}
      />
    </div>
  )
}
