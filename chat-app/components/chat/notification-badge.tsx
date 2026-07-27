'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChat } from '@/components/providers/chat-provider'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useChat()
  const [isOpen, setIsOpen] = useState(false)

  const formatTime = (date: string | null | undefined) => {
    if (!date) return ''
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const handleNotificationClick = async (notificationId: string, isRead: boolean | null) => {
    if (!isRead) {
      await markNotificationRead(notificationId)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-semibold">Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={markAllNotificationsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-1 p-3',
                  !notification.is_read && 'bg-accent/50'
                )}
                onClick={() => handleNotificationClick(notification.id, notification.is_read)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-medium">{notification.title}</span>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                {notification.body && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.body}
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(notification.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
