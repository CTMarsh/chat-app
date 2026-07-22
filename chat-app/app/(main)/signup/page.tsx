'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard, AuthInputWrapper } from '@/components/auth/auth-card'
import { Mail, Lock, Loader2, CheckCircle, User, UserPlus, ShieldOff } from 'lucide-react'
import { checkSignupsAllowed } from '@/lib/actions/platform-settings'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [signupsDisabled, setSignupsDisabled] = useState(false)
  const [checkingSignups, setCheckingSignups] = useState(true)

  // Check if signups are allowed on mount
  useEffect(() => {
    const check = async () => {
      const { allowed } = await checkSignupsAllowed()
      setSignupsDisabled(!allowed)
      setCheckingSignups(false)
    }
    check()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Re-check before submitting (setting may have changed)
    const { allowed } = await checkSignupsAllowed()
    if (!allowed) {
      setSignupsDisabled(true)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const username = email.split('@')[0]

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name.trim() || null,
          username: username,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (checkingSignups) {
    return (
      <AuthCard
        title="Create an account"
        description="Checking availability..."
        icon={<Loader2 className="h-7 w-7 text-primary animate-spin" />}
      >
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthCard>
    )
  }

  if (signupsDisabled) {
    return (
      <AuthCard
        title="Signups disabled"
        description="New account registration is currently unavailable"
        icon={<ShieldOff className="h-7 w-7 text-muted-foreground" />}
        footer={
          <Link href="/login">
            <Button variant="outline" className="shadow-sm">
              Back to Login
            </Button>
          </Link>
        }
      >
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Signups are currently disabled by the platform administrator. Please contact your administrator for access.
          </p>
        </div>
      </AuthCard>
    )
  }

  if (success) {
    return (
      <AuthCard
        title="Check your email"
        description={
          <>
            We&apos;ve sent a confirmation link to <strong className="text-foreground">{email}</strong>
          </>
        }
        icon={<CheckCircle className="h-7 w-7 text-ark-good" />}
        footer={
          <Link href="/login">
            <Button variant="outline" className="shadow-sm">
              Back to Login
            </Button>
          </Link>
        }
      >
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Click the link in your email to confirm your account and sign in.
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Create an account"
      description="Enter your details to get started"
      icon={<UserPlus className="h-7 w-7 text-primary" />}
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ark-blue-bright hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSignup} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <AuthInputWrapper icon={<User className="h-4 w-4" />}>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 pl-10 transition-shadow focus:shadow-md"
            />
          </AuthInputWrapper>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <AuthInputWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="password"
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-10 transition-shadow focus:shadow-md"
                required
                minLength={8}
              />
            </AuthInputWrapper>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <AuthInputWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 pl-10 transition-shadow focus:shadow-md"
                required
                minLength={8}
              />
            </AuthInputWrapper>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Create Account
        </Button>
      </form>
    </AuthCard>
  )
}
