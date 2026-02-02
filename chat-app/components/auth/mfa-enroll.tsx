'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface MFAEnrollProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnrolled: () => void
}

export function MFAEnroll({ open, onOpenChange, onEnrolled }: MFAEnrollProps) {
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      enrollFactor()
    } else {
      // Reset state when dialog closes
      setFactorId('')
      setQrCode('')
      setSecret('')
      setVerifyCode('')
      setError('')
    }
  }, [open])

  const enrollFactor = async () => {
    setEnrolling(true)
    setError('')

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

  const handleVerify = async () => {
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

      onEnrolled()
      onOpenChange(false)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app, then enter the verification code.
          </DialogDescription>
        </DialogHeader>

        {enrolling ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
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
                  <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            {/* Verification input */}
            <div className="space-y-2">
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-widest"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || verifyCode.length !== 6 || enrolling}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
