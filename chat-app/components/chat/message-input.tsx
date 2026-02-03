'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react'
import { Send, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat } from '@/components/providers/chat-provider'
import { EmojiPicker } from './emoji-picker'
import { FileUploadButton } from './file-upload-button'
import { MentionList } from './mention-list'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { getPreferences } from '@/lib/actions/settings'

// Check if a string contains only emoji characters (up to 5 emojis)
function isEmojiOnly(text: string): boolean {
  if (!text.trim()) return false
  // Remove whitespace and check if remaining chars are all emojis
  const trimmed = text.replace(/\s/g, '')
  // Emoji regex pattern that matches most common emojis
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u
  // Only apply big emoji style for 1-5 emojis
  const emojiCount = [...trimmed].filter(char => /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u.test(char)).length
  return emojiRegex.test(trimmed) && emojiCount <= 5
}

export function MessageInput() {
  const { activeConversation, currentUser, sendMessageWithMentions, setTyping } = useChat()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  const [mentionedUsers, setMentionedUsers] = useState<Profile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [enterKeyBehavior, setEnterKeyBehavior] = useState<'send' | 'newline'>('send')
  const [sendTypingIndicators, setSendTypingIndicators] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data } = await getPreferences()
      if (data) {
        setEnterKeyBehavior(data.enter_key_behavior)
        setSendTypingIndicators(data.send_typing_indicators)
      }
    }
    loadPreferences()
  }, [])

  // Get participants for mentions (only in group chats)
  const mentionableUsers = useMemo(() => {
    if (!activeConversation || activeConversation.type !== 'group') return []
    return activeConversation.participants
      .filter(p => p.user_id !== currentUser?.id)
      .map(p => p.profile)
  }, [activeConversation, currentUser?.id])

  // Filter users based on mention query
  const filteredMentionUsers = useMemo(() => {
    if (!mentionQuery) return mentionableUsers.slice(0, 5)
    const query = mentionQuery.toLowerCase()
    return mentionableUsers
      .filter(u =>
        u.username.toLowerCase().includes(query) ||
        u.display_name?.toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [mentionableUsers, mentionQuery])

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
    if (!activeConversation || !sendTypingIndicators) return

    setTyping(activeConversation.id, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeConversation.id, false)
    }, 2000)
  }, [activeConversation, setTyping, sendTypingIndicators])

  // Detect @ mentions while typing
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    handleTyping()

    // Check for @ trigger
    const textarea = textareaRef.current
    if (textarea && activeConversation?.type === 'group') {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = newContent.slice(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
        // Check if we're still in a mention (no space after @)
        if (!/\s/.test(textAfterAt)) {
          setShowMentions(true)
          setMentionQuery(textAfterAt)
          setMentionSelectedIndex(0)
          return
        }
      }
    }
    setShowMentions(false)
    setMentionQuery('')
  }

  const handleMentionSelect = (user: Profile) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = content.slice(cursorPos)

    // Replace @query with @username
    const newContent = content.slice(0, lastAtIndex) + `@${user.username} ` + textAfterCursor
    setContent(newContent)
    setShowMentions(false)
    setMentionQuery('')

    // Track mentioned user
    if (!mentionedUsers.find(u => u.id === user.id)) {
      setMentionedUsers([...mentionedUsers, user])
    }

    // Set cursor position after mention
    setTimeout(() => {
      const newPos = lastAtIndex + user.username.length + 2
      textarea.selectionStart = textarea.selectionEnd = newPos
      textarea.focus()
    }, 0)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // Allow sending with either content or file
    if ((!content.trim() && !selectedFile) || !activeConversation || isSending) return

    setIsSending(true)
    const messageContent = content.trim()
    const fileToSend = selectedFile

    // Extract mentioned user IDs from the content
    const mentionedUserIds = mentionedUsers
      .filter(u => messageContent.includes(`@${u.username}`))
      .map(u => u.id)

    setContent('')
    setSelectedFile(null)
    setMentionedUsers([])

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTyping(activeConversation.id, false)

    try {
      setUploadError(null)
      await sendMessageWithMentions(
        messageContent || (fileToSend ? `Sent a ${fileToSend.type.startsWith('image/') ? 'photo' : 'file'}` : ''),
        activeConversation.id,
        mentionedUserIds,
        fileToSend || undefined
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      // Check if it's a file scan error
      if (errorMessage.includes('File rejected') || errorMessage.includes('scan')) {
        setUploadError(errorMessage)
        setSelectedFile(null) // Clear the infected file
        setContent(messageContent) // Keep the text
      } else {
        setContent(messageContent)
        setSelectedFile(fileToSend)
        setUploadError(errorMessage)
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention navigation
    if (showMentions && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionSelectedIndex(prev =>
          prev < filteredMentionUsers.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredMentionUsers.length - 1
        )
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleMentionSelect(filteredMentionUsers[mentionSelectedIndex])
        return
      }
      if (e.key === 'Escape') {
        setShowMentions(false)
        return
      }
    }

    // Handle Enter key based on preference
    if (e.key === 'Enter') {
      if (enterKeyBehavior === 'send' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      } else if (enterKeyBehavior === 'newline' && (e.ctrlKey || e.metaKey)) {
        // When newline mode, Ctrl/Cmd+Enter sends
        e.preventDefault()
        handleSubmit()
      }
      // In newline mode with plain Enter, let it create a new line naturally
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

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(content + emoji)
    }
    handleTyping()
  }

  return (
    <form onSubmit={handleSubmit} className="relative border-t bg-card/30 p-4 backdrop-blur-sm">
      {uploadError && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive shadow-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => setUploadError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {showMentions && filteredMentionUsers.length > 0 && (
        <MentionList
          users={filteredMentionUsers}
          selectedIndex={mentionSelectedIndex}
          onSelect={handleMentionSelect}
        />
      )}
      <div className="flex items-end gap-2">
        <FileUploadButton
          onFileSelect={setSelectedFile}
          isUploading={isSending}
          selectedFile={selectedFile}
          onClear={() => setSelectedFile(null)}
        />
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeConversation?.type === 'group' ? 'Type a message... (use @ to mention)' : 'Type a message...'}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border/50 bg-background/80 px-4 py-3 min-h-12",
            "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:shadow-lg focus:shadow-primary/5",
            isEmojiOnly(content) ? "text-3xl leading-relaxed" : "text-base"
          )}
          rows={1}
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={(!content.trim() && !selectedFile) || isSending}
          className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
