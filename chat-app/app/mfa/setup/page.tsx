'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Shield, Loader2, LogOut } from 'lucide-react'

export default function MFASetupPage() {
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAndEnroll = async () => {
      // Check if user already has MFA
      const { data: factors } = await supabase.auth.mfa.listFactors()

      if (factors?.totp.some(f => f.status === 'verified')) {
        // Already has MFA, redirect to chat
        router.push('/chat')
        return
      }

      // Clean up any unverified factors from previous attempts
      const unverifiedFactors = factors?.totp.filter(f => (f.status as string) === 'unverified') || []
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      // Start enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      })

      if (error) {
        setError(error.message)
        setEnrolling(false)
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
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      // Verify
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

      // Success - redirect to chat
      router.push('/chat')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (enrolling) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            For your security, two-factor authentication is required. Scan the QR code with your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg border bg-white p-4">
                  <img src={qrCode} alt="QR Code" className="h-48 w-48" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Can&apos;t scan? Enter this code manually:
                  </p>
                  <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono break-all">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            {/* Verification input */}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || verifyCode.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
