'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WidgetForm } from './widget-form'
import { WidgetHeader } from './widget-header'
import { WidgetMessageList } from './widget-message-list'
import { WidgetMessageInput } from './widget-message-input'
import { WidgetOffline } from './widget-offline'

interface WidgetConfig {
  widgetId: string
  name: string
  primaryColor: string
  position: string
  welcomeMessage: string
  offlineMessage: string
  requireEmail: boolean
  collectName: boolean
  agentsOnline: boolean
}

interface ConversationStatus {
  ended_at: string | null
}

interface WidgetSession {
  sessionToken: string
  sessionId: string
  email: string
  name: string
  conversationId: string | null
}

interface WidgetMessage {
  id: string
  content: string
  createdAt: string
  type: string
  isFromVisitor: boolean
  visitorName?: string
  visitorEmail?: string
  sender?: {
    id: string
    displayName: string
    avatarUrl: string
  }
}

export function WidgetChat({ embedToken }: { embedToken: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [session, setSession] = useState<WidgetSession | null>(null)
  const [messages, setMessages] = useState<WidgetMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [showEndedUI, setShowEndedUI] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Initialize widget
  useEffect(() => {
    const initWidget = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/widget-init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embedToken,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to initialize widget')
        }

        const widgetConfig = await response.json()
        setConfig(widgetConfig)

        // Try to resume session from localStorage
        const savedSession = sessionStorage.getItem(`widget_session_${embedToken}`)
        if (savedSession) {
          const parsed = JSON.parse(savedSession)
          await resumeSession(parsed.sessionToken)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load widget')
      } finally {
        setIsLoading(false)
      }
    }

    initWidget()
  }, [embedToken, supabaseUrl])

  // Resume existing session
  const resumeSession = async (sessionToken: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/visitor-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedToken, sessionToken }),
      })

      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
        setConversationId(sessionData.conversationId)

        // Save session
        sessionStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(sessionData))

        // Load messages if conversation exists
        if (sessionData.conversationId) {
          await loadMessages(sessionData.sessionToken, sessionData.conversationId)
        }
      }
    } catch (err) {
      console.error('Failed to resume session:', err)
      sessionStorage.removeItem(`widget_session_${embedToken}`)
    }
  }

  // Create new session
  const createSession = async (email: string, name: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/visitor-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedToken, email, name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start session')
      }

      const sessionData = await response.json()
      setSession(sessionData)
      setConversationId(sessionData.conversationId)

      // Save session
      sessionStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(sessionData))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start chat')
      return false
    }
  }

  // Load messages
  const loadMessages = useCallback(async (sessionToken: string, convId: string, isPolling = false) => {
    try {
      const params = new URLSearchParams({
        sessionToken,
        conversationId: convId,
      })

      // Only get new messages when polling
      if (isPolling && lastMessageTimeRef.current) {
        params.append('after', lastMessageTimeRef.current)
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/visitor-messages?${params.toString()}`,
        { method: 'GET' }
      )

      if (response.ok) {
        const data = await response.json()

        if (isPolling && data.messages.length > 0) {
          // Append new messages
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = data.messages.filter((m: WidgetMessage) => !existingIds.has(m.id))
            return [...prev, ...newMessages]
          })
        } else if (!isPolling) {
          // Replace all messages
          setMessages(data.messages)
        }

        // Update last message time
        if (data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1]
          lastMessageTimeRef.current = lastMsg.createdAt
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }, [supabaseUrl])

  // Check if conversation is ended
  const checkConversationStatus = useCallback(async (convId: string) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/visitor-messages?sessionToken=${session?.sessionToken}&conversationId=${convId}&statusOnly=true`,
        { method: 'GET' }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.ended_at && !isEnded) {
          setIsEnded(true)
          setShowEndedUI(true)
          // Clear polling when ended
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      }
    } catch (err) {
      console.error('Failed to check conversation status:', err)
    }
  }, [supabaseUrl, session?.sessionToken, isEnded])

  // Generate and download transcript
  const downloadTranscript = () => {
    if (!messages.length || !session) return

    const lines = [
      `Chat Transcript`,
      `===============`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Visitor: ${session.name} (${session.email})`,
      ``,
      `Messages:`,
      `---------------`,
      '',
    ]

    messages.forEach(msg => {
      const time = new Date(msg.createdAt).toLocaleTimeString()
      const sender = msg.isFromVisitor ? session.name : (msg.sender?.displayName || 'Support Agent')
      lines.push(`[${time}] ${sender}:`)
      lines.push(msg.content)
      lines.push('')
    })

    lines.push('---------------')
    lines.push('End of transcript')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-transcript-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Start new chat (reset session)
  const startNewChat = () => {
    // Clear localStorage
    sessionStorage.removeItem(`widget_session_${embedToken}`)
    // Reset all state
    setSession(null)
    setMessages([])
    setConversationId(null)
    setIsEnded(false)
    setShowEndedUI(false)
    lastMessageTimeRef.current = null
  }

  // Polling for new messages
  useEffect(() => {
    if (session?.sessionToken && conversationId && !isEnded) {
      // Initial load
      loadMessages(session.sessionToken, conversationId)

      // Start polling
      pollingRef.current = setInterval(() => {
        loadMessages(session.sessionToken, conversationId, true)
        checkConversationStatus(conversationId)
      }, 3000) // Poll every 3 seconds

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [session?.sessionToken, conversationId, loadMessages, checkConversationStatus, isEnded])

  // Send message
  const sendMessage = async (content: string) => {
    if (!session?.sessionToken || !content.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/visitor-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          content: content.trim(),
          conversationId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const result = await response.json()

      // Update conversation ID if this was the first message
      if (!conversationId && result.conversationId) {
        setConversationId(result.conversationId)

        // Update saved session
        const updatedSession = { ...session, conversationId: result.conversationId }
        setSession(updatedSession)
        sessionStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(updatedSession))
      }

      // Add message to list (optimistic update)
      const newMessage: WidgetMessage = {
        id: result.messageId,
        content: result.content,
        createdAt: result.createdAt,
        type: 'text',
        isFromVisitor: true,
        visitorName: result.visitorName,
        visitorEmail: result.visitorEmail,
      }

      setMessages(prev => [...prev, newMessage])
      lastMessageTimeRef.current = result.createdAt
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // Error state
  if (error && !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-white p-4">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    )
  }

  // No config
  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-white p-4">
        <p className="text-gray-500 text-center">Widget not available</p>
      </div>
    )
  }

  const primaryColor = config.primaryColor || '#6366f1'

  return (
    <div
      className="flex flex-col h-screen bg-white"
      style={{ '--widget-primary': primaryColor } as React.CSSProperties}
    >
      <WidgetHeader
        title={config.name}
        agentsOnline={config.agentsOnline}
        primaryColor={primaryColor}
        isEnded={showEndedUI}
        onClose={startNewChat}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!session ? (
          // Show form if no session
          <WidgetForm
            welcomeMessage={config.welcomeMessage}
            requireEmail={config.requireEmail}
            collectName={config.collectName}
            primaryColor={primaryColor}
            onSubmit={createSession}
          />
        ) : showEndedUI ? (
          // Show full-screen ended conversation UI
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
            {/* Checkmark icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke={primaryColor}
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title and description */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation Ended</h2>
            <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">
              Thank you for chatting with us! You can download a transcript of this conversation.
            </p>

            {/* Action buttons */}
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={downloadTranscript}
                className="w-full py-3 px-4 text-sm font-medium rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Transcript
              </button>
              <button
                onClick={startNewChat}
                className="w-full py-3 px-4 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        ) : !config.agentsOnline && messages.length === 0 ? (
          // Show offline message if no agents and no existing conversation
          <WidgetOffline
            offlineMessage={config.offlineMessage}
            primaryColor={primaryColor}
            onSendOfflineMessage={sendMessage}
          />
        ) : (
          // Show chat interface
          <>
            <WidgetMessageList
              messages={messages}
              primaryColor={primaryColor}
            />
            <WidgetMessageInput
              onSend={sendMessage}
              isSending={isSending}
              primaryColor={primaryColor}
              disabled={isEnded}
            />
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
