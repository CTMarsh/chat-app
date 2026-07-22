'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCheck, Smile, Paperclip, Send, Hash, Circle } from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────

const mockUsers = [
  { id: 'sarah', name: 'Sarah Chen', avatar: 'SC', color: 'from-ark-cyan to-ark-blue', online: true },
  { id: 'james', name: 'James Wright', avatar: 'JW', color: 'from-ark-blue to-ark-cyan', online: true },
  { id: 'emma', name: 'Emma Davis', avatar: 'ED', color: 'from-ark-crit to-ark-amber', online: false },
  { id: 'you', name: 'You', avatar: 'YO', color: 'from-primary to-primary/70', online: true },
]

interface MockMessage {
  id: number
  senderId: string
  content: string
  time: string
  reactions?: { emoji: string; count: number }[]
  reactionDelay?: number
  read?: boolean
  isFile?: boolean
  fileName?: string
}

const conversationScript: MockMessage[] = [
  {
    id: 1,
    senderId: 'sarah',
    content: 'Hey team! Just pushed the new design system updates',
    time: '10:32 AM',
  },
  {
    id: 2,
    senderId: 'james',
    content: 'Nice work! The new components look clean',
    time: '10:33 AM',
    reactions: [{ emoji: '🔥', count: 2 }],
    reactionDelay: 1200,
  },
  {
    id: 3,
    senderId: 'you',
    content: 'Love the colour palette choices! The gradients are smooth',
    time: '10:33 AM',
    read: true,
  },
  {
    id: 4,
    senderId: 'sarah',
    content: "Thanks! Here's the Figma link for reference",
    time: '10:34 AM',
    isFile: true,
    fileName: 'design-system-v2.fig',
  },
  {
    id: 5,
    senderId: 'james',
    content: "Let's ship it this sprint 🚀",
    time: '10:35 AM',
    reactions: [{ emoji: '👍', count: 3 }, { emoji: '🎉', count: 1 }],
    reactionDelay: 800,
  },
  {
    id: 6,
    senderId: 'you',
    content: 'Already on it! PR incoming shortly',
    time: '10:35 AM',
    read: true,
  },
]

const mockConversations = [
  {
    id: 1,
    name: 'Design Team',
    avatar: 'DT',
    isGroup: true,
    lastMessage: 'Sarah: Just pushed the new design...',
    time: '2m',
    unread: 3,
    online: false,
    color: 'from-ark-cyan to-ark-blue',
  },
  {
    id: 2,
    name: 'James Wright',
    avatar: 'JW',
    lastMessage: 'Sounds good, see you then!',
    time: '15m',
    unread: 0,
    online: true,
    color: 'from-ark-blue to-ark-cyan',
  },
  {
    id: 3,
    name: 'Emma Davis',
    avatar: 'ED',
    lastMessage: 'The report is ready for review',
    time: '1h',
    unread: 1,
    online: false,
    color: 'from-ark-crit to-ark-amber',
  },
  {
    id: 4,
    name: 'Alex Kim',
    avatar: 'AK',
    lastMessage: 'Thanks for the update!',
    time: '3h',
    unread: 0,
    online: true,
    color: 'from-ark-good to-ark-cyan',
  },
]

// ── Typing Indicator ──────────────────────────────────────

function TypingIndicator({ userName }: { userName: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[9px] text-muted-foreground">{userName} is typing...</span>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────

function MessageBubble({
  message,
  showReactions,
}: {
  message: MockMessage
  showReactions: boolean
}) {
  const sender = mockUsers.find(u => u.id === message.senderId)
  const isOwn = message.senderId === 'you'

  return (
    <div
      className={`flex gap-1.5 animate-in fade-in slide-in-from-bottom-3 duration-500 ${
        isOwn ? 'flex-row-reverse' : ''
      }`}
    >
      {!isOwn && (
        <div
          className={`h-5 w-5 rounded-full bg-gradient-to-br ${sender?.color} flex items-center justify-center text-[8px] font-medium text-white flex-shrink-0 shadow-sm`}
        >
          {sender?.avatar}
        </div>
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : ''} max-w-[75%]`}>
        {!isOwn && (
          <span className="text-[9px] font-medium text-muted-foreground mb-0.5 px-1">
            {sender?.name}
          </span>
        )}
        <div
          className={`rounded-2xl px-2.5 py-1.5 shadow-sm ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          <p className="text-[11px] leading-relaxed">{message.content}</p>
          {message.isFile && (
            <div className={`mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] ${
              isOwn ? 'bg-primary-foreground/10' : 'bg-background/80'
            }`}>
              <Paperclip className="h-2.5 w-2.5" />
              <span className="truncate">{message.fileName}</span>
            </div>
          )}
        </div>
        {message.reactions && showReactions && (
          <div className={`flex gap-0.5 mt-0.5 animate-in fade-in zoom-in-50 duration-300 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {message.reactions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded-full border bg-background px-1.5 py-0.5 text-[9px] shadow-sm"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[9px] text-muted-foreground">{message.time}</span>
          {isOwn && message.read && (
            <CheckCheck className="h-2.5 w-2.5 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Chat Preview ─────────────────────────────────────

export function ChatPreview() {
  const [visibleMessages, setVisibleMessages] = useState<MockMessage[]>([])
  const [showReactions, setShowReactions] = useState<Set<number>>(new Set())
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // Main animation loop
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const runAnimation = async () => {
      setIsAnimating(true)

      for (let i = 0; i < conversationScript.length; i++) {
        const msg = conversationScript[i]
        const sender = mockUsers.find(u => u.id === msg.senderId)

        // Show typing indicator (not for own messages)
        if (msg.senderId !== 'you') {
          setTypingUser(sender?.name || '')
          await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
        } else {
          await new Promise(r => setTimeout(r, 600))
        }

        // Hide typing, show message
        setTypingUser(null)
        setVisibleMessages(prev => [...prev, msg])
        setCurrentIndex(i + 1)

        // Small delay then scroll
        await new Promise(r => setTimeout(r, 100))

        // Show reactions with delay
        if (msg.reactions) {
          const delay = msg.reactionDelay || 1000
          setTimeout(() => {
            setShowReactions(prev => new Set([...prev, msg.id]))
          }, delay)
        }

        // Pause between messages
        await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
      }

      // Pause, then restart
      await new Promise(r => setTimeout(r, 4000))
      setVisibleMessages([])
      setShowReactions(new Set())
      setCurrentIndex(0)
      setTypingUser(null)
      hasStartedRef.current = false
      setIsAnimating(false)
    }

    // Initial delay before starting
    const timeout = setTimeout(runAnimation, 1500)
    return () => clearTimeout(timeout)
  }, [isAnimating])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages, typingUser, scrollToBottom])

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg bg-background text-sm select-none">
      {/* ── Mini Sidebar ── */}
      <div className="hidden sm:flex w-[150px] flex-col border-r bg-card/50">
        {/* Sidebar Header */}
        <div className="border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
              YO
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold truncate block">Your Name</span>
              <span className="flex items-center gap-1 text-[9px] text-ark-good">
                <Circle className="h-1.5 w-1.5 fill-ark-good text-ark-good" />
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-2 py-1.5">
          <div className="rounded-md bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground">
            Search chats...
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden py-0.5">
          {mockConversations.map((conv, i) => (
            <div
              key={conv.id}
              className={`flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg cursor-pointer transition-all duration-200 ${
                i === 0
                  ? 'bg-primary/10 shadow-sm'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white bg-gradient-to-br ${conv.color} shadow-sm`}
                >
                  {conv.isGroup && <Hash className="h-3 w-3" />}
                  {!conv.isGroup && conv.avatar}
                </div>
                {conv.online && !conv.isGroup && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-ark-good" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[11px] truncate ${i === 0 ? 'font-semibold' : 'font-medium'}`}>
                    {conv.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                  {conv.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-ark-cyan to-ark-blue flex items-center justify-center text-white shadow-sm">
                <Hash className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold">Design Team</p>
              <p className="text-[10px] text-muted-foreground">Sarah, James, Emma &middot; 4 members</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1.5">
              {mockUsers.slice(0, 3).map(u => (
                <div
                  key={u.id}
                  className={`h-5 w-5 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-[7px] font-medium text-white border-2 border-background shadow-sm`}
                >
                  {u.avatar}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-none">
          {visibleMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showReactions={showReactions.has(msg.id)}
            />
          ))}
          {typingUser && <TypingIndicator userName={typingUser} />}
        </div>

        {/* Input */}
        <div className="border-t p-2">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 ring-1 ring-border/50">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">Type a message...</span>
            <Smile className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Send className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
