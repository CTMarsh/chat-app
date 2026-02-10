'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CheckCheck,
  Smile,
  Paperclip,
  Send,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Circle,
  Image,
  AtSign,
  MessageSquare,
  Zap,
  Shield,
  Pin,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────

interface DemoMessage {
  id: number
  senderId: 'alex' | 'you'
  content: string
  time: string
  reactions?: { emoji: string; count: number }[]
  reactionDelay?: number
  read?: boolean
  isFile?: boolean
  fileName?: string
  fileType?: string
  isMention?: boolean
  isPinned?: boolean
  /** Which feature this message demonstrates */
  feature?: string
}

// ── Mock Data ─────────────────────────────────────────────

const demoScript: DemoMessage[] = [
  {
    id: 1,
    senderId: 'alex',
    content: 'Hey! Are you free to review the new dashboard designs?',
    time: '2:14 PM',
    feature: 'realtime',
  },
  {
    id: 2,
    senderId: 'you',
    content: 'Sure thing, send them over!',
    time: '2:14 PM',
    read: true,
    feature: 'read-receipts',
  },
  {
    id: 3,
    senderId: 'alex',
    content: 'Here you go — let me know what you think',
    time: '2:15 PM',
    isFile: true,
    fileName: 'dashboard-v3-final.png',
    fileType: 'image',
    feature: 'file-sharing',
  },
  {
    id: 4,
    senderId: 'you',
    content: 'These look incredible! Love the new sidebar layout',
    time: '2:16 PM',
    read: true,
    reactions: [{ emoji: '🔥', count: 1 }],
    reactionDelay: 1000,
    feature: 'reactions',
  },
  {
    id: 5,
    senderId: 'alex',
    content: 'Thanks! I pinned the design spec in #design-team if you need the details',
    time: '2:16 PM',
    isPinned: true,
    feature: 'pins',
  },
  {
    id: 6,
    senderId: 'you',
    content: 'Perfect. Let me loop in @emma for the frontend implementation',
    time: '2:17 PM',
    read: true,
    isMention: true,
    feature: 'mentions',
  },
  {
    id: 7,
    senderId: 'alex',
    content: "Great idea! She'll nail the animations",
    time: '2:17 PM',
    reactions: [{ emoji: '👍', count: 2 }, { emoji: '🎉', count: 1 }],
    reactionDelay: 800,
    feature: 'reactions',
  },
]

const demoConversations = [
  { id: 1, name: 'Alex Rivera', initials: 'AR', color: 'from-blue-500 to-indigo-600', online: true, lastMsg: 'She\'ll nail the animations', time: 'now', unread: 0, active: true },
  { id: 2, name: 'Design Team', initials: '#', color: 'from-violet-500 to-purple-600', online: false, lastMsg: 'Sarah: New mockups ready', time: '5m', unread: 3, isGroup: true },
  { id: 3, name: 'Emma Wilson', initials: 'EW', color: 'from-pink-500 to-rose-600', online: true, lastMsg: 'On it!', time: '12m', unread: 0 },
  { id: 4, name: 'Project Alpha', initials: '#', color: 'from-emerald-500 to-green-600', online: false, lastMsg: 'James: Build passed', time: '1h', unread: 1, isGroup: true },
  { id: 5, name: 'Tom Bradley', initials: 'TB', color: 'from-amber-500 to-orange-600', online: false, lastMsg: 'See you Monday!', time: '3h', unread: 0 },
]

const featureHighlights = [
  { key: 'realtime', icon: Zap, label: 'Real-time Messages', description: 'Messages appear instantly with typing indicators' },
  { key: 'read-receipts', icon: CheckCheck, label: 'Read Receipts', description: 'Know when your messages have been seen' },
  { key: 'file-sharing', icon: Image, label: 'File Sharing', description: 'Share images and files up to 50MB with virus scanning' },
  { key: 'reactions', icon: Smile, label: 'Emoji Reactions', description: 'React to any message with emoji' },
  { key: 'pins', icon: Pin, label: 'Pinned Messages', description: 'Pin important messages for easy reference' },
  { key: 'mentions', icon: AtSign, label: '@Mentions', description: 'Tag people to send them a notification' },
]

// ── Typing Indicator ──────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-2 px-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 shadow-sm">
        AR
      </div>
      <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────

function DemoBubble({
  message,
  showReactions,
}: {
  message: DemoMessage
  showReactions: boolean
}) {
  const isOwn = message.senderId === 'you'

  return (
    <div
      className={`flex gap-2 animate-in fade-in slide-in-from-bottom-3 duration-500 ${
        isOwn ? 'flex-row-reverse' : ''
      }`}
    >
      {!isOwn && (
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 shadow-sm mt-0.5">
          AR
        </div>
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : ''} max-w-[70%]`}>
        <div
          className={`rounded-2xl px-3 py-2 shadow-sm relative ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          {message.isPinned && (
            <div className={`absolute -top-2 ${isOwn ? '-left-2' : '-right-2'}`}>
              <div className="h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                <Pin className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
          )}
          <p className="text-[13px] leading-relaxed">
            {message.isMention ? (
              <>
                Perfect. Let me loop in{' '}
                <span className="rounded bg-primary/20 px-1 font-medium text-primary">@emma</span>
                {' '}for the frontend implementation
              </>
            ) : (
              message.content
            )}
          </p>
          {message.isFile && (
            <div className={`mt-2 rounded-lg overflow-hidden border ${
              isOwn ? 'border-primary-foreground/20' : 'border-border'
            }`}>
              <div className={`h-28 flex items-center justify-center ${
                isOwn ? 'bg-primary-foreground/10' : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30'
              }`}>
                <div className="flex flex-col items-center gap-1.5 opacity-60">
                  <Image className="h-8 w-8" />
                  <span className="text-[10px] font-medium">{message.fileName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {message.reactions && showReactions && (
          <div className={`flex gap-1 mt-1 animate-in fade-in zoom-in-75 duration-300 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {message.reactions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded-full border bg-background px-2 py-0.5 text-xs shadow-sm hover:bg-muted transition-colors cursor-default"
              >
                {r.emoji} <span className="text-muted-foreground">{r.count}</span>
              </span>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-muted-foreground">{message.time}</span>
          {isOwn && message.read && (
            <CheckCheck className="h-3 w-3 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Feature Pill ──────────────────────────────────────────

function FeaturePill({
  icon: Icon,
  label,
  description,
  active,
}: {
  icon: React.ElementType
  label: string
  description: string
  active: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-500 ${
        active
          ? 'border-primary/40 bg-primary/10 shadow-md shadow-primary/10 scale-[1.02]'
          : 'border-border/50 bg-card/30'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500 flex-shrink-0 ${
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-semibold transition-colors duration-300 ${active ? 'text-primary' : ''}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  )
}

// ── Demo Section ──────────────────────────────────────────

export function DemoSection() {
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([])
  const [showReactions, setShowReactions] = useState<Set<number>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const scrollToBottom = useCallback(() => {
    const container = messagesRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // Start animation when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [hasStarted])

  // Main animation loop
  useEffect(() => {
    if (!hasStarted) return
    if (isAnimating) return

    const runAnimation = async () => {
      setIsAnimating(true)

      for (let i = 0; i < demoScript.length; i++) {
        const msg = demoScript[i]

        // Highlight the feature this message demonstrates
        if (msg.feature) {
          setActiveFeature(msg.feature)
        }

        // Show typing indicator for other person
        if (msg.senderId === 'alex') {
          setIsTyping(true)
          await new Promise(r => setTimeout(r, 1400 + Math.random() * 800))
        } else {
          await new Promise(r => setTimeout(r, 700))
        }

        // Show message
        setIsTyping(false)
        setVisibleMessages(prev => [...prev, msg])

        await new Promise(r => setTimeout(r, 150))
        scrollToBottom()

        // Show reactions with delay
        if (msg.reactions) {
          const delay = msg.reactionDelay || 1000
          setTimeout(() => {
            setShowReactions(prev => new Set([...prev, msg.id]))
          }, delay)
        }

        // Pause between messages
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500))
      }

      // Hold the final state, then reset and loop
      await new Promise(r => setTimeout(r, 5000))
      setVisibleMessages([])
      setShowReactions(new Set())
      setIsTyping(false)
      setActiveFeature(null)
      setIsAnimating(false)
      setHasStarted(false)
    }

    const timeout = setTimeout(runAnimation, 800)
    return () => clearTimeout(timeout)
  }, [hasStarted, isAnimating, scrollToBottom])

  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages, isTyping, scrollToBottom])

  return (
    <section ref={sectionRef} id="demo" className="relative py-20 md:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live Demo
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch a real conversation unfold. Every feature you see here works exactly
            like this in the app.
          </p>
        </div>

        {/* Demo Layout: Chat + Feature Callouts */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start max-w-6xl mx-auto">

          {/* ── Large Chat Window ── */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-card shadow-2xl shadow-primary/10 overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-primary/80 to-primary/50" />

            <div className="flex h-[520px]">
              {/* Mini Sidebar */}
              <div className="hidden md:flex w-[200px] flex-col border-r bg-card/50">
                {/* Sidebar Header */}
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                      YO
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold block">Your Name</span>
                      <span className="flex items-center gap-1 text-[11px] text-green-600">
                        <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <Search className="h-3 w-3" />
                    Search chats...
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-hidden py-1">
                  {demoConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg transition-all duration-200 ${
                        conv.active
                          ? 'bg-primary/10 shadow-sm'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-medium text-white bg-gradient-to-br ${conv.color} shadow-sm`}>
                          {conv.isGroup ? '#' : conv.initials}
                        </div>
                        {conv.online && !conv.isGroup && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${conv.active ? 'font-semibold' : 'font-medium'}`}>
                            {conv.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{conv.lastMsg}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-1 flex-col min-w-0">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-medium text-white shadow-sm">
                        AR
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Alex Rivera</p>
                      <p className="text-[11px] text-green-600 font-medium">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                  {visibleMessages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-2">
                      <MessageSquare className="h-10 w-10" />
                      <span className="text-sm">Demo starting...</span>
                    </div>
                  )}
                  {visibleMessages.map(msg => (
                    <DemoBubble
                      key={msg.id}
                      message={msg}
                      showReactions={showReactions.has(msg.id)}
                    />
                  ))}
                  {isTyping && <TypingDots />}
                </div>

                {/* Input */}
                <div className="border-t p-3">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 ring-1 ring-border/50">
                    <Paperclip className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1">Type a message...</span>
                    <Smile className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Send className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Feature Callouts (right side) ── */}
          <div className="space-y-3 lg:sticky lg:top-24">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-4">
              Features in this demo
            </h3>
            {featureHighlights.map((f) => (
              <FeaturePill
                key={f.key}
                icon={f.icon}
                label={f.label}
                description={f.description}
                active={activeFeature === f.key}
              />
            ))}
            <div className="pt-4 px-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch as each feature lights up when it appears in the conversation.
                All powered by real-time WebSocket connections and secured with mandatory MFA.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-600">End-to-end secured with RLS + MFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
