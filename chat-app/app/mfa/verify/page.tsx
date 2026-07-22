'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/auth-card'
import { Shield, Loader2, LogOut, ShieldCheck } from 'lucide-react'

export default function MFAVerifyPage() {
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkMFA = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        console.error('Error listing factors:', error)
        router.push('/login')
        return
      }

      const totpFactor = data.totp.find(factor => factor.status === 'verified')
      if (!totpFactor) {
        router.push('/chat')
        return
      }

      setFactorId(totpFactor.id)
    }

    checkMFA()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) return

    setError(null)
    setLoading(true)

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }

      router.push('/chat')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!factorId) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthCard
      title="Two-Factor Authentication"
      description="Enter the code from your authenticator app to continue"
      icon={<ShieldCheck className="h-7 w-7 text-primary" />}
      footer={
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      }
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-primary/60" />
          <p className="text-sm text-muted-foreground">
            Open your authenticator app and enter the 6-digit code
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="code" className="text-center block">Verification Code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
            className="h-14 text-center text-3xl tracking-[0.5em] font-mono transition-shadow focus:shadow-md"
            autoFocus
            required
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={loading || verifyCode.length !== 6}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          Verify & Continue
        </Button>
      </form>
    </AuthCard>
  )
}
