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
  Building2,
  Code,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const settingsNavItems = [
  { title: 'Profile', href: '/chat/settings/profile', icon: User },
  { title: 'Appearance', href: '/chat/settings/appearance', icon: Palette },
  { title: 'Messages', href: '/chat/settings/messages', icon: MessageSquare },
  { title: 'Notifications', href: '/chat/settings/notifications', icon: Bell },
  { title: 'Privacy', href: '/chat/settings/privacy', icon: Lock },
  { title: 'Security', href: '/chat/settings/security', icon: Shield },
  { title: 'Accessibility', href: '/chat/settings/accessibility', icon: Accessibility },
  { title: 'Workspaces', href: '/chat/settings/workspaces', icon: Building2 },
  { title: 'Widgets', href: '/chat/settings/widgets', icon: Code },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="flex h-14 items-center gap-3 px-4">
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

        {/* Horizontal Navigation Tabs */}
        <div className="overflow-x-auto">
          <nav className="flex gap-1 px-4 pb-3" aria-label="Settings navigation">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </div>
    </div>
  )
}
