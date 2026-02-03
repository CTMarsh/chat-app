'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Palette,
  MessageSquare,
  Bell,
  Lock,
  Shield,
  Accessibility,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const settingsNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Avatar, name, username',
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
    description: 'Theme, colors, layout',
  },
  {
    title: 'Messages',
    href: '/settings/messages',
    icon: MessageSquare,
    description: 'Chat behavior, emoji',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Alerts, sounds, DND',
  },
  {
    title: 'Privacy',
    href: '/settings/privacy',
    icon: Lock,
    description: 'Visibility, blocked',
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Shield,
    description: 'MFA, sessions',
  },
  {
    title: 'Accessibility',
    href: '/settings/accessibility',
    icon: Accessibility,
    description: 'Motion, contrast',
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-72 flex-col border-r bg-card">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
            <Link href="/chat">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to chat</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted group-hover:bg-background'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium">{item.title}</div>
                <div
                  className={cn(
                    'truncate text-xs transition-colors',
                    isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Customize your experience
        </p>
      </div>
    </div>
  )
}
