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
  Smartphone,
  Laptop,
  Globe,
  X,
  Plus,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingSection } from '@/components/settings/setting-section'
import { createClient } from '@/lib/supabase/client'
import { changePassword } from '@/lib/actions/auth'
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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setIsChangingPassword(true)
    const { error } = await changePassword(currentPassword, newPassword)
    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setIsChangingPassword(false)
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

  const hasMFA = mfaFactors.length > 0
  const otherSessions = sessions.filter(s => !s.is_current)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account security settings
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'bg-ark-good/10 text-ark-good border border-ark-good/30'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* 2FA Status Card */}
          <SettingSection
            title="Status"
            description={hasMFA ? 'Your account is protected' : 'Add an extra layer of security'}
            accent
          >
            {hasMFA ? (
              <div className="flex items-center gap-4 rounded-lg border border-ark-good/30 bg-ark-good/10 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ark-good/15">
                  <ShieldCheck className="h-6 w-6 text-ark-good" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    2FA Enabled
                  </p>
                  <p className="text-sm text-ark-good">
                    {mfaFactors.length} authenticator{mfaFactors.length > 1 ? 's' : ''} configured
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-ark-warn/30 bg-ark-warn/10 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ark-warn/15">
                    <ShieldOff className="h-6 w-6 text-ark-warn" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Not Protected
                    </p>
                    <p className="text-sm text-ark-warn">
                      Enable 2FA for better security
                    </p>
                  </div>
                </div>
                <Button onClick={() => setEnrollOpen(true)} className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}
          </SettingSection>

          {/* Authentication Methods Card */}
          <SettingSection
            title="Authenticators"
            description="Manage your authentication devices"
          >
            {hasMFA ? (
              <div className="space-y-3">
                {mfaFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {factor.friendly_name || 'Authenticator App'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedFactorId(factor.id)
                        setUnenrollOpen(true)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEnrollOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  No authenticators configured
                </p>
              </div>
            )}
          </SettingSection>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <SettingSection
          title="Update your password"
          description="Choose a strong password with at least 8 characters"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Change Password
            </Button>
          </form>
        </SettingSection>
      </div>

      {/* Active Sessions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
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
                    {otherSessions.length} session(s) will be revoked.
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

        <div className="rounded-xl border bg-card">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No active sessions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => {
                const { device, icon: DeviceIcon } = parseUserAgent(session.user_agent)
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between gap-4 p-4 ${
                      session.is_current ? 'bg-ark-good/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        session.is_current ? 'bg-ark-good/15' : 'bg-muted'
                      }`}>
                        <DeviceIcon className={`h-5 w-5 ${
                          session.is_current ? 'text-ark-good' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{device}</p>
                          {session.is_current && (
                            <span className="rounded-full bg-ark-good/15 px-2 py-0.5 text-xs font-medium text-ark-good">
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatRelativeTime(session.last_active_at)}
                          {session.ip_address && ` · ${session.ip_address}`}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                              This will immediately sign out this device. You will need to sign in again to access your account from that device.
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
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sign Out</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign Out All Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out All Devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out from all devices, including this one. You will need to sign in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOutAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign Out All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
