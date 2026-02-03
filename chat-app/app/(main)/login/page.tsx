'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard, AuthInputWrapper } from '@/components/auth/auth-card'
import { Mail, Lock, Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

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

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      icon={<LogIn className="h-7 w-7 text-primary" />}
      footer={
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
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
          className="h-11 w-full text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Sign In
        </Button>
      </form>
    </AuthCard>
  )
}
