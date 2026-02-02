'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat } from '@/components/providers/chat-provider'

export function MessageInput() {
  const { activeConversation, sendMessage, setTyping } = useChat()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [content, adjustHeight])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!activeConversation) return

    setTyping(activeConversation.id, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeConversation.id, false)
    }, 2000)
  }, [activeConversation, setTyping])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!content.trim() || !activeConversation || isSending) return

    setIsSending(true)
    const messageContent = content.trim()
    setContent('')

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTyping(activeConversation.id, false)

    try {
      await sendMessage(messageContent, activeConversation.id)
    } catch (error) {
      console.error('Failed to send message:', error)
      setContent(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => {
            setContent(e.target.value)
            handleTyping()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={1}
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isSending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
