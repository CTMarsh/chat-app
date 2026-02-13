'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ConversationWithParticipants, MessageWithSender, Notification } from '@/lib/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { scanFile } from '@/lib/utils/scan-file'
import { getPreferences } from '@/lib/actions/settings'
import { getPlatformSettingValue } from '@/lib/actions/platform-settings'
import { endConversation as endConversationAction } from '@/lib/actions/conversations'

interface FileAttachment {
  file: File
  url: string
  name: string
  size: number
  type: string
}

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
  replyTo: MessageWithSender | null
  setReplyTo: (message: MessageWithSender) => void
  clearReplyTo: () => void
  sendMessage: (content: string, conversationId: string, file?: File, replyToId?: string) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  setTyping: (conversationId: string, isTyping: boolean) => void
  refreshConversations: () => Promise<void>
  fetchConversationById: (conversationId: string) => Promise<ConversationWithParticipants | null>
  toggleReaction: (messageId: string, emoji: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  sendMessageWithMentions: (content: string, conversationId: string, mentionedUserIds: string[], file?: File, replyToId?: string) => Promise<void>
  pinnedMessages: MessageWithSender[]
  pinMessage: (messageId: string) => Promise<void>
  unpinMessage: (messageId: string) => Promise<void>
  updateUserStatus: (status: string) => Promise<void>
  endConversation: (conversationId: string) => Promise<{ error: string | null }>
  maxFileSizeMb: number
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
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithSender[]>([])
  const channelsRef = useRef<RealtimeChannel[]>([])
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50)
  const [replyTo, setReplyToState] = useState<MessageWithSender | null>(null)

  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  const setReplyTo = useCallback((message: MessageWithSender) => {
    setReplyToState(message)
  }, [])

  const clearReplyTo = useCallback(() => {
    setReplyToState(null)
  }, [])

  // Fetch current user profile
  const fetchCurrentUser = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      // Get user's status preference
      const { data: prefs } = await getPreferences()
      const statusPreference = prefs?.online_status_preference ?? 'online'
      const showOnlineStatus = prefs?.show_online_status ?? true

      // Determine the actual status to set
      // 'invisible' preference maps to 'offline' in the profiles table
      // If show_online_status is false, also appear offline
      let actualStatus: string = statusPreference
      if (statusPreference === 'invisible' || !showOnlineStatus) {
        actualStatus = 'offline'
      }

      // Update status based on user preference
      await supabase
        .from('profiles')
        .update({ status: actualStatus, last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      // Set currentUser with the correct status
      setCurrentUser({ ...data, status: actualStatus })
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
        ),
        visitor_session:visitor_sessions(*),
        widget:widgets(*, workspace:workspaces(*))
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (conversationsData) {
      // Fetch last message and unread count for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conv) => {
          const [lastMessageResult, unreadCountResult] = await Promise.all([
            supabase
              .from('messages')
              .select('*, sender:profiles!messages_sender_id_fkey(*), visitor_name, visitor_email')
              .eq('conversation_id', conv.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
            supabase.rpc('get_unread_count', { conv_id: conv.id, usr_id: userId }),
          ])

          return {
            ...conv,
            last_message: lastMessageResult.data || undefined,
            unread_count: unreadCountResult.data || 0,
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
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Error fetching messages:', error)
      return
    }

    if (data) {
      // Fetch reactions and read receipts for all messages
      const messageIds = data.map(m => m.id)
      const [reactionsResult, receiptsResult] = await Promise.all([
        supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds),
        supabase
          .from('message_read_receipts')
          .select('*')
          .in('message_id', messageIds),
      ])

      const messagesWithData = data.map(message => ({
        ...message,
        reactions: reactionsResult.data?.filter(r => r.message_id === message.id) || [],
        read_receipts: receiptsResult.data?.filter(r => r.message_id === message.id) || [],
      }))

      setMessages(messagesWithData as MessageWithSender[])

      // Mark messages as read - but only if user has send_read_receipts enabled
      const unreadMessages = data.filter(m => m.sender_id !== userId)
      if (unreadMessages.length > 0) {
        // Check user's preference before sending read receipts
        const { data: prefs } = await getPreferences()
        const sendReadReceipts = prefs?.send_read_receipts ?? true

        if (sendReadReceipts) {
          const receipts = unreadMessages.map(m => ({
            message_id: m.id,
            user_id: userId,
          }))
          await supabase
            .from('message_read_receipts')
            .upsert(receipts, { onConflict: 'message_id,user_id' })
        }
      }
    }

    // Fetch pinned messages
    const { data: pinnedData } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .eq('is_pinned', true)
      .is('deleted_at', null)
      .order('pinned_at', { ascending: false })

    if (pinnedData) {
      setPinnedMessages(pinnedData as MessageWithSender[])
    }
  }, [supabase])

  // Pin a message
  const pinMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: userId,
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error pinning message:', error)
      throw error
    }

    // Update local state
    const pinnedMessage = messages.find(m => m.id === messageId)
    if (pinnedMessage) {
      const updated = { ...pinnedMessage, is_pinned: true, pinned_at: new Date().toISOString(), pinned_by: userId }
      setPinnedMessages(prev => [updated, ...prev])
      setMessages(prev =>
        prev.map(m => m.id === messageId ? updated : m)
      )
    }
  }, [supabase, userId, messages])

  // Unpin a message
  const unpinMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error unpinning message:', error)
      throw error
    }

    // Update local state
    setPinnedMessages(prev => prev.filter(m => m.id !== messageId))
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, is_pinned: false, pinned_at: null, pinned_by: null } : m)
    )
  }, [supabase])

  // Update user status (both in DB and local state)
  const updateUserStatus = useCallback(async (status: string) => {
    // Map 'invisible' to 'offline' for the profiles table
    const dbStatus = status === 'invisible' ? 'offline' : status

    const { error } = await supabase
      .from('profiles')
      .update({ status: dbStatus })
      .eq('id', userId)

    if (error) {
      console.error('Error updating status:', error)
      throw error
    }

    // Update local state immediately
    setCurrentUser(prev => prev ? { ...prev, status: dbStatus } : null)
  }, [supabase, userId])

  // End a widget conversation
  const endConversation = useCallback(async (conversationId: string): Promise<{ error: string | null }> => {
    const result = await endConversationAction(conversationId)

    if (!result.error) {
      // Update local state
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, ended_at: new Date().toISOString() }
            : c
        )
      )

      // Update active conversation if it's the one that was ended
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev =>
          prev ? { ...prev, ended_at: new Date().toISOString() } : null
        )
      }
    }

    return result
  }, [activeConversation?.id])

  // Send message
  const sendMessage = useCallback(async (content: string, conversationId: string, file?: File, replyToId?: string) => {
    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null
    let fileType: string | null = null

    // Upload file if provided
    if (file) {
      // Enforce max_file_size_mb
      const maxBytes = maxFileSizeMb * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error(`File must be less than ${maxFileSizeMb}MB`)
      }

      // Scan file for viruses before uploading
      try {
        const scanResult = await scanFile(file)
        if (!scanResult.isClean) {
          throw new Error(`File rejected: ${scanResult.message}`)
        }
        if (!scanResult.skipped) {
          console.log('File scan passed:', scanResult.message)
        }
      } catch (scanError) {
        console.error('File scan failed:', scanError)
        throw scanError
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${conversationId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath)

      fileUrl = publicUrl
      fileName = file.name
      fileSize = file.size
      fileType = file.type
    }

    const messageType = file?.type.startsWith('image/') ? 'image' : file ? 'file' : 'text'

    const now = new Date().toISOString()

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        content,
        conversation_id: conversationId,
        sender_id: userId,
        type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        reply_to_id: replyToId || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    // Immediate UI update using the real DB ID
    if (currentUser && inserted) {
      const newMessage: MessageWithSender = {
        id: inserted.id,
        content,
        conversation_id: conversationId,
        sender_id: userId,
        type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        deleted_by: null,
        reply_to_id: replyToId || null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        link_previews: null,
        is_edited: false,
        visitor_name: null,
        visitor_email: null,
        search_vector: null,
        sender: currentUser,
        reactions: [],
        read_receipts: [],
      }
      setMessages(prev => [...prev, newMessage])
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }, [supabase, userId, currentUser, maxFileSizeMb])

  // Send message with mentions
  const sendMessageWithMentions = useCallback(async (
    content: string,
    conversationId: string,
    mentionedUserIds: string[],
    file?: File,
    replyToId?: string
  ) => {
    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null
    let fileType: string | null = null

    // Upload file if provided
    if (file) {
      // Enforce max_file_size_mb
      const maxBytes = maxFileSizeMb * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error(`File must be less than ${maxFileSizeMb}MB`)
      }

      // Scan file for viruses before uploading
      try {
        const scanResult = await scanFile(file)
        if (!scanResult.isClean) {
          throw new Error(`File rejected: ${scanResult.message}`)
        }
        if (!scanResult.skipped) {
          console.log('File scan passed:', scanResult.message)
        }
      } catch (scanError) {
        console.error('File scan failed:', scanError)
        throw scanError
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${conversationId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath)

      fileUrl = publicUrl
      fileName = file.name
      fileSize = file.size
      fileType = file.type
    }

    const messageType = file?.type.startsWith('image/') ? 'image' : file ? 'file' : 'text'

    // Extract URLs for link previews (with SSRF protection)
    const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g
    const rawUrls = content.match(urlRegex) || []
    const urls = rawUrls.filter(u => {
      try {
        const parsed = new URL(u)
        if (!['http:', 'https:'].includes(parsed.protocol)) return false
        const h = parsed.hostname
        if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
        if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(h)) return false
        if (u.length > 2048) return false
        return true
      } catch { return false }
    })
    let linkPreviews: Array<{url: string; title?: string; description?: string; image?: string; siteName?: string}> = []

    // Fetch link previews (limit to first 3 URLs)
    if (urls.length > 0) {
      const previewPromises = urls.slice(0, 3).map(async (url) => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-link-preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ url }),
          })
          if (response.ok) {
            return await response.json()
          }
          return { url }
        } catch {
          return { url }
        }
      })
      linkPreviews = await Promise.all(previewPromises)
    }

    const now = new Date().toISOString()

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        content,
        conversation_id: conversationId,
        sender_id: userId,
        type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        link_previews: linkPreviews.length > 0 ? linkPreviews : null,
        reply_to_id: replyToId || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    // Immediate UI update using the real DB ID
    if (currentUser && inserted) {
      const newMessage: MessageWithSender = {
        id: inserted.id,
        content,
        conversation_id: conversationId,
        sender_id: userId,
        type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        deleted_by: null,
        reply_to_id: replyToId || null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        link_previews: linkPreviews.length > 0 ? linkPreviews : null,
        is_edited: false,
        visitor_name: null,
        visitor_email: null,
        search_vector: null,
        sender: currentUser,
        reactions: [],
        read_receipts: [],
      }
      setMessages(prev => [...prev, newMessage])
    }

    // Create mentions using the real inserted message ID
    if (mentionedUserIds.length > 0 && inserted) {
      const mentions = mentionedUserIds.map(mentionedUserId => ({
        message_id: inserted.id,
        mentioned_user_id: mentionedUserId,
      }))
      await supabase.from('message_mentions').insert(mentions)
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }, [supabase, userId, currentUser, maxFileSizeMb])

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

  // Fetch a single conversation by ID (for immediate navigation)
  const fetchConversationById = useCallback(async (conversationId: string): Promise<ConversationWithParticipants | null> => {
    // First check if we already have it
    const existing = conversations.find(c => c.id === conversationId)
    if (existing) return existing

    // Fetch from database
    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', conversationId)
      .single()

    if (!convData) return null

    // Fetch last message
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const conversationWithDetails: ConversationWithParticipants = {
      ...convData,
      last_message: lastMessage || undefined,
      unread_count: 0,
    }

    // Add to conversations list if not present
    setConversations(prev => {
      if (prev.find(c => c.id === conversationId)) return prev
      return [conversationWithDetails, ...prev]
    })

    return conversationWithDetails
  }, [supabase, conversations])

  // Delete message (soft delete)
  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', messageId)
      .eq('sender_id', userId) // Only allow deleting own messages

    if (error) {
      console.error('Error deleting message:', error)
      throw error
    }

    // Update local state
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, deleted_at: new Date().toISOString(), deleted_by: userId }
          : m
      )
    )
  }, [supabase, userId])

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (error) {
      console.error('Error editing message:', error)
      throw error
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, content: newContent, is_edited: true, updated_at: new Date().toISOString() }
          : m
      )
    )
  }, [supabase, userId])

  // Toggle reaction on a message
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const existingReaction = messages
      .find(m => m.id === messageId)
      ?.reactions?.find(r => r.user_id === userId && r.emoji === emoji)

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id)

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, reactions: m.reactions?.filter(r => r.id !== existingReaction.id) }
            : m
        )
      )
    } else {
      // Add reaction
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .select()
        .single()

      if (!error && data) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, reactions: [...(m.reactions || []), data] }
              : m
          )
        )
      }
    }
  }, [supabase, userId, messages])

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
              .select('*, sender:profiles!messages_sender_id_fkey(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              // Add or replace message if it's for the active conversation
              if (activeConversation?.id === data.conversation_id) {
                setMessages(prev => {
                  const existingIndex = prev.findIndex(m => m.id === data.id)
                  if (existingIndex >= 0) {
                    // Replace optimistic message with full server data
                    const updated = [...prev]
                    updated[existingIndex] = data as MessageWithSender
                    return updated
                  }
                  return [...prev, data as MessageWithSender]
                })
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

      channelsRef.current = [messagesChannel, notificationsChannel, profilesChannel]
    }

    setupSubscriptions()

    return () => {
      channelsRef.current.forEach(channel => supabase.removeChannel(channel))
      channelsRef.current = []
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
        getPlatformSettingValue('max_file_size_mb').then(({ data }) => {
          if (data) {
            const parsed = parseInt(data, 10)
            if (!isNaN(parsed)) setMaxFileSizeMb(parsed)
          }
        }),
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
        replyTo,
        setReplyTo,
        clearReplyTo,
        setActiveConversation,
        sendMessage,
        markAsRead,
        markNotificationRead,
        markAllNotificationsRead,
        setTyping,
        refreshConversations,
        fetchConversationById,
        toggleReaction,
        deleteMessage,
        editMessage,
        sendMessageWithMentions,
        pinnedMessages,
        pinMessage,
        unpinMessage,
        updateUserStatus,
        endConversation,
        maxFileSizeMb,
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
