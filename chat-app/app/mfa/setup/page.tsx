'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/auth-card'
import { Shield, Loader2, LogOut, Smartphone } from 'lucide-react'

export default function MFASetupPage() {
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(true)
  const enrollingRef = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Guard against StrictMode double-mount race condition
    if (enrollingRef.current) return
    enrollingRef.current = true

    const checkAndEnroll = async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors()

      if (factors?.totp.some(f => f.status === 'verified')) {
        router.push('/chat')
        return
      }

      const unverifiedFactors = factors?.totp.filter(f => (f.status as string) === 'unverified') || []
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      })

      if (error) {
        // If enroll fails due to existing factor (e.g. from a previous attempt),
        // re-fetch factors and use the existing unverified one
        const { data: retryFactors } = await supabase.auth.mfa.listFactors()
        const existing = retryFactors?.totp.find(f => (f.status as string) === 'unverified')
        if (existing) {
          // Unenroll the stale factor and try once more
          await supabase.auth.mfa.unenroll({ factorId: existing.id })
          const { data: retryData, error: retryError } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'Authenticator App',
          })
          if (retryError) {
            setError(retryError.message)
            setEnrolling(false)
            enrollingRef.current = false
            return
          }
          setFactorId(retryData.id)
          setQrCode(retryData.totp.qr_code)
          setSecret(retryData.totp.secret)
          setEnrolling(false)
          return
        }

        setError(error.message)
        setEnrolling(false)
        enrollingRef.current = false
        return
      }

      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setEnrolling(false)
    }

    checkAndEnroll()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId || verifyCode.length !== 6) return

    setLoading(true)
    setError('')

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
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (enrolling) {
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
      title="Set Up Two-Factor Authentication"
      description="For your security, two-factor authentication is required"
      icon={<Shield className="h-7 w-7 text-primary" />}
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

        {/* QR Code */}
        {qrCode && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <img src={qrCode} alt="QR Code" className="relative h-48 w-48" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Scan with your authenticator app</span>
            </div>

            <div className="w-full rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Can&apos;t scan? Enter this code manually:
              </p>
              <code className="block rounded bg-background px-3 py-2 text-xs font-mono break-all border">
                {secret}
              </code>
            </div>
          </div>
        )}

        {/* Verification input */}
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
          />
          <p className="text-xs text-muted-foreground text-center">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={loading || verifyCode.length !== 6}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shield className="mr-2 h-4 w-4" />
          )}
          Complete Setup
        </Button>
      </form>
    </AuthCard>
  )
}
