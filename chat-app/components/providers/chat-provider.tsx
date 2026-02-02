'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ConversationWithParticipants, MessageWithSender, Notification } from '@/lib/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatContextType {
  currentUser: Profile | null
  conversations: ConversationWithParticipants[]
  activeConversation: ConversationWithParticipants | null
  messages: MessageWithSender[]
  notifications: Notification[]
  unreadCount: number
  typingUsers: Map<string, string[]>
  isLoading: boolean
  setActiveConversation: (conversation: ConversationWithParticipants | null) => void
  sendMessage: (content: string, conversationId: string) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  setTyping: (conversationId: string, isTyping: boolean) => void
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [channels, setChannels] = useState<RealtimeChannel[]>([])

  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Fetch current user profile
  const fetchCurrentUser = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setCurrentUser(data)
      // Update status to online
      await supabase
        .from('profiles')
        .update({ status: 'online', last_seen_at: new Date().toISOString() })
        .eq('id', userId)
    }
  }, [supabase, userId])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!participantData?.length) {
      setConversations([])
      return
    }

    const conversationIds = participantData.map(p => p.conversation_id)

    const { data: conversationsData } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (conversationsData) {
      // Fetch last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            last_message: lastMessage || undefined,
          } as ConversationWithParticipants
        })
      )

      setConversations(conversationsWithLastMessage)
    }
  }, [supabase, userId])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data)
    }
  }, [supabase, userId])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*), reply_to:messages(*, sender:profiles(*))')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data as MessageWithSender[])
    }
  }, [supabase])

  // Send message
  const sendMessage = useCallback(async (content: string, conversationId: string) => {
    const { error } = await supabase
      .from('messages')
      .insert({
        content,
        conversation_id: conversationId,
        sender_id: userId,
        type: 'text',
      })

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }, [supabase, userId])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
  }, [supabase, userId])

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
  }, [supabase])

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [supabase, userId])

  // Set typing status
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const channel = supabase.channel(`typing:${conversationId}`)
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping },
    })
  }, [supabase, userId])

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await fetchConversations()
  }, [fetchConversations])

  // Setup realtime subscriptions
  useEffect(() => {
    const setupSubscriptions = async () => {
      // Messages subscription
      const messagesChannel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            // Fetch the complete message with sender
            const { data } = await supabase
              .from('messages')
              .select('*, sender:profiles(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              // Add to messages if it's for the active conversation
              if (activeConversation?.id === data.conversation_id) {
                setMessages(prev => [...prev, data as MessageWithSender])
              }

              // Refresh conversations to update last message
              fetchConversations()
            }
          }
        )
        .subscribe()

      // Notifications subscription
      const notificationsChannel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        )
        .subscribe()

      // Profile status subscription
      const profilesChannel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          () => {
            // Refresh conversations to update participant statuses
            fetchConversations()
          }
        )
        .subscribe()

      setChannels([messagesChannel, notificationsChannel, profilesChannel])
    }

    setupSubscriptions()

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [supabase, userId, activeConversation?.id, fetchConversations])

  // Setup typing subscription for active conversation
  useEffect(() => {
    if (!activeConversation) return

    const typingChannel = supabase
      .channel(`typing:${activeConversation.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === userId) return

        setTypingUsers(prev => {
          const updated = new Map(prev)
          const current = updated.get(activeConversation.id) || []

          if (payload.isTyping && !current.includes(payload.userId)) {
            updated.set(activeConversation.id, [...current, payload.userId])
          } else if (!payload.isTyping) {
            updated.set(activeConversation.id, current.filter(id => id !== payload.userId))
          }

          return updated
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(typingChannel)
    }
  }, [supabase, activeConversation?.id, userId])

  // Initial data fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchCurrentUser(),
        fetchConversations(),
        fetchNotifications(),
      ])
      setIsLoading(false)
    }

    init()

    // Update status to offline on unmount
    return () => {
      supabase
        .from('profiles')
        .update({ status: 'offline', last_seen_at: new Date().toISOString() })
        .eq('id', userId)
    }
  }, [fetchCurrentUser, fetchConversations, fetchNotifications, supabase, userId])

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
      markAsRead(activeConversation.id)
    } else {
      setMessages([])
    }
  }, [activeConversation?.id, fetchMessages, markAsRead])

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        conversations,
        activeConversation,
        messages,
        notifications,
        unreadCount,
        typingUsers,
        isLoading,
        setActiveConversation,
        sendMessage,
        markAsRead,
        markNotificationRead,
        markAllNotificationsRead,
        setTyping,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
