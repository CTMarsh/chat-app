'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Zap,
  Users,
  Paperclip,
  Smile,
  AtSign,
  Pin,
  Eye,
  Lock
} from 'lucide-react'

// ── Animated Counter ──────────────────────────────────────

function AnimatedStat({
  value,
  label,
  suffix = ''
}: {
  value: number
  label: string
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )

    const el = document.getElementById(`stat-${label.replace(/\s/g, '-')}`)
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [value, label, hasAnimated])

  return (
    <div id={`stat-${label.replace(/\s/g, '-')}`} className="text-center">
      <div className="text-3xl font-bold text-primary md:text-4xl">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

// ── Feature Showcase Item ─────────────────────────────────

function FeatureShowcase({
  icon: Icon,
  title,
  description,
  delay
}: {
  icon: React.ElementType
  title: string
  description: string
  delay: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all duration-700 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-sm flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Demo Section ──────────────────────────────────────────

const showcaseFeatures = [
  {
    icon: Zap,
    title: 'Real-time Everything',
    description: 'Messages, typing indicators, and status updates arrive instantly via WebSocket connections.',
  },
  {
    icon: Users,
    title: 'Group Conversations',
    description: 'Create group chats with multiple participants, roles, and @mention support.',
  },
  {
    icon: Paperclip,
    title: 'File Sharing',
    description: 'Share files up to 50MB with automatic virus scanning and image previews.',
  },
  {
    icon: Smile,
    title: 'Emoji Reactions',
    description: 'React to messages with emoji. Quick-pick favourites or browse the full library.',
  },
  {
    icon: AtSign,
    title: '@Mentions',
    description: 'Tag team members with @mentions and they get instant notifications.',
  },
  {
    icon: Pin,
    title: 'Pinned Messages',
    description: 'Pin important messages to conversations for easy reference later.',
  },
  {
    icon: Eye,
    title: 'Read Receipts',
    description: 'Know when your messages have been seen with real-time read indicators.',
  },
  {
    icon: Lock,
    title: 'Mandatory MFA',
    description: 'Every account requires TOTP multi-factor authentication. Security first.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description: 'Database-level policies ensure users can only access their own conversations.',
  },
]

export function DemoSection() {
  return (
    <section id="demo" className="relative py-20 md:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            Live Demo
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature is built for speed, security, and a seamless experience.
            Here&apos;s what powers your conversations.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm">
          <AnimatedStat value={50} label="Max File Size" suffix="MB" />
          <AnimatedStat value={100} label="Uptime SLA" suffix="%" />
          <AnimatedStat value={2} label="Factor Auth" suffix="FA" />
          <AnimatedStat value={6} label="Reaction Types" suffix="+" />
        </div>

        {/* Feature Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcaseFeatures.map((feature, i) => (
            <FeatureShowcase
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={200 + i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
