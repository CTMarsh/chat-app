'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface WidgetFormProps {
  welcomeMessage: string
  requireEmail: boolean
  collectName: boolean
  primaryColor: string
  onSubmit: (email: string, name: string) => Promise<boolean>
}

export function WidgetForm({
  welcomeMessage,
  requireEmail,
  collectName,
  primaryColor,
  onSubmit,
}: WidgetFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (requireEmail && !email.trim()) {
      setError('Email is required')
      return
    }

    if (requireEmail && !isValidEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    if (collectName && !name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    const success = await onSubmit(email.trim(), name.trim() || 'Visitor')
    setIsSubmitting(false)

    if (!success) {
      setError('Failed to start chat. Please try again.')
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-6">
          <p className="text-foreground text-center">{welcomeMessage}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {collectName && (
            <div>
              <label
                htmlFor="widget-name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Your Name {collectName && <span className="text-destructive">*</span>}
              </label>
              <input
                id="widget-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                disabled={isSubmitting}
              />
            </div>
          )}

          {requireEmail && (
            <div>
              <label
                htmlFor="widget-email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Your Email <span className="text-destructive">*</span>
              </label>
              <input
                id="widget-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                disabled={isSubmitting}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Start Chat
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        We&apos;ll use your information to respond to your inquiry
      </p>
    </div>
  )
}
