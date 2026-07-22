'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Settings,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Audit Log', href: '/admin/audit', icon: ScrollText },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with red gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ark-crit via-ark-crit to-ark-amber" />
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Button variant="ghost" size="icon" asChild className="hover:bg-ark-crit/10">
            <Link href="/chat">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to chat</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ark-crit/10">
              <ShieldAlert className="h-4 w-4 text-ark-crit" />
            </div>
            <span className="font-semibold">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {adminNavItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-ark-crit/10 text-ark-crit'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Platform Administration
        </p>
      </div>
    </div>
  )
}
