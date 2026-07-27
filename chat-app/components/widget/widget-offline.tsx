'use client'

import { useState } from 'react'
import { Clock, Send } from 'lucide-react'

interface WidgetOfflineProps {
  offlineMessage: string
  primaryColor: string
  onSendOfflineMessage: (content: string) => Promise<void>
}

export function WidgetOffline({
  offlineMessage,
  primaryColor,
  onSendOfflineMessage,
}: WidgetOfflineProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendOfflineMessage(message.trim())
      setSent(true)
      setMessage('')
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Send className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Message Sent!
        </h3>
        <p className="text-muted-foreground text-sm">
          We&apos;ll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm underline"
          style={{ color: primaryColor }}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Clock className="w-7 h-7" style={{ color: primaryColor }} />
        </div>
        <p className="text-muted-foreground mb-6 max-w-xs">
          {offlineMessage}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave us a message..."
            rows={4}
            disabled={isSending}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none mb-3"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="w-full py-2.5 px-4 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Leave a Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
