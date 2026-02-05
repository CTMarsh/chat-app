'use client'

import { useState } from 'react'
import { Check, Copy, Link, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChat } from '@/components/providers/chat-provider'

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const { currentUser } = useChat()
  const [copied, setCopied] = useState(false)

  // Generate invite link with referral
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteLink = currentUser
    ? `${baseUrl}/signup?ref=${currentUser.id}`
    : `${baseUrl}/signup`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Join me on Chat')
    const body = encodeURIComponent(
      `Hey!\n\nI'd like to invite you to join me on Chat. Click the link below to sign up:\n\n${inviteLink}\n\nSee you there!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" aria-hidden="true" />
            Invite to Chat
          </DialogTitle>
          <DialogDescription>
            Share this link with friends and colleagues to invite them to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="font-mono text-sm"
              aria-label="Invite link"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy invite link'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEmailShare}
            >
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              Share via Email
            </Button>
          </div>

          {copied && (
            <p className="text-center text-sm text-green-600 dark:text-green-400" role="status">
              Link copied to clipboard!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
