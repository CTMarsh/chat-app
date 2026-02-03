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
        const savedSession = localStorage.getItem(`widget_session_${embedToken}`)
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
        localStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(sessionData))

        // Load messages if conversation exists
        if (sessionData.conversationId) {
          await loadMessages(sessionData.sessionToken, sessionData.conversationId)
        }
      }
    } catch (err) {
      console.error('Failed to resume session:', err)
      localStorage.removeItem(`widget_session_${embedToken}`)
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
      localStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(sessionData))

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

  // Polling for new messages
  useEffect(() => {
    if (session?.sessionToken && conversationId) {
      // Initial load
      loadMessages(session.sessionToken, conversationId)

      // Start polling
      pollingRef.current = setInterval(() => {
        loadMessages(session.sessionToken, conversationId, true)
      }, 3000) // Poll every 3 seconds

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [session?.sessionToken, conversationId, loadMessages])

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
        localStorage.setItem(`widget_session_${embedToken}`, JSON.stringify(updatedSession))
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
