'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard, AuthInputWrapper } from '@/components/auth/auth-card'
import { Mail, Lock, Loader2, LogIn } from 'lucide-react'

const MAX_ATTEMPTS = 5
const LOCKOUT_BASE_MS = 15_000 // 15 seconds
const LOCKOUT_MAX_MS = 300_000 // 5 minutes

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const router = useRouter()
  const failedAttempts = useRef(0)
  const lockoutUntil = useRef(0)
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLockoutCountdown = useCallback((durationMs: number) => {
    lockoutUntil.current = Date.now() + durationMs
    setLockoutRemaining(Math.ceil(durationMs / 1000))

    if (lockoutTimer.current) clearInterval(lockoutTimer.current)
    lockoutTimer.current = setInterval(() => {
      const remaining = Math.max(0, lockoutUntil.current - Date.now())
      setLockoutRemaining(Math.ceil(remaining / 1000))
      if (remaining <= 0 && lockoutTimer.current) {
        clearInterval(lockoutTimer.current)
        lockoutTimer.current = null
      }
    }, 1000)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check lockout
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000)
      setError(`Too many failed attempts. Please wait ${secs} seconds.`)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      failedAttempts.current += 1

      if (failedAttempts.current >= MAX_ATTEMPTS) {
        const lockoutMs = Math.min(
          LOCKOUT_BASE_MS * Math.pow(2, failedAttempts.current - MAX_ATTEMPTS),
          LOCKOUT_MAX_MS
        )
        startLockoutCountdown(lockoutMs)
        setError(`Too many failed attempts. Please wait ${Math.ceil(lockoutMs / 1000)} seconds before trying again.`)
      } else {
        const remaining = MAX_ATTEMPTS - failedAttempts.current
        setError(`${error.message}${remaining <= 2 ? ` (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` : ''}`)
      }

      setLoading(false)
      return
    }

    // Reset on success
    failedAttempts.current = 0

    // Check MFA status
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const { data: factors } = await supabase.auth.mfa.listFactors()

    const hasVerifiedFactor = factors?.totp.some(f => f.status === 'verified')

    if (hasVerifiedFactor && aalData?.currentLevel !== 'aal2') {
      router.push('/mfa/verify')
    } else if (!hasVerifiedFactor) {
      router.push('/mfa/setup')
    } else {
      router.push('/chat')
    }
    router.refresh()
  }

  const isLockedOut = lockoutRemaining > 0

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to pick up the conversation."
      icon={<LogIn className="h-7 w-7 text-primary" />}
      footer={
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-ark-blue-bright hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLockedOut && (
          <div className="rounded-lg border border-ark-warn/30 bg-ark-warn/10 p-3 text-sm text-ark-warn">
            Account temporarily locked. Try again in {lockoutRemaining}s
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <AuthInputWrapper icon={<Mail className="h-4 w-4" />}>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10 transition-shadow focus:shadow-md"
              required
            />
          </AuthInputWrapper>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <AuthInputWrapper icon={<Lock className="h-4 w-4" />}>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10 transition-shadow focus:shadow-md"
              required
            />
          </AuthInputWrapper>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={loading || isLockedOut}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          {isLockedOut ? `Locked (${lockoutRemaining}s)` : 'Sign In'}
        </Button>
      </form>
    </AuthCard>
  )
}
