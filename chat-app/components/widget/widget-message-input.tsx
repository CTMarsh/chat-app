'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface WidgetMessageInputProps {
  onSend: (content: string) => Promise<void>
  isSending: boolean
  primaryColor: string
}

export function WidgetMessageInput({
  onSend,
  isSending,
  primaryColor,
}: WidgetMessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    const content = message.trim()
    setMessage('')
    await onSend(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-3 flex items-end gap-2"
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={isSending}
        className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
      />
      <button
        type="submit"
        disabled={!message.trim() || isSending}
        className="p-2.5 rounded-lg text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {isSending ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  )
}
