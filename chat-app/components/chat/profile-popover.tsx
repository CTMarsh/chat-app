'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Circle, Clock, MinusCircle, EyeOff, Check, Ban, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/components/providers/preferences-provider'
import { useChat } from '@/components/providers/chat-provider'
import type { Profile } from '@/lib/types/database'

interface ProfilePopoverProps {
  profile: Profile
  isCurrentUser?: boolean
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

const statusOptions = [
  { value: 'online', label: 'Online', icon: Circle, color: 'text-ark-good', bgColor: 'bg-ark-good' },
  { value: 'away', label: 'Away', icon: Clock, color: 'text-ark-warn', bgColor: 'bg-ark-warn' },
  { value: 'dnd', label: 'Do Not Disturb', icon: MinusCircle, color: 'text-ark-crit', bgColor: 'bg-ark-crit' },
  { value: 'invisible', label: 'Invisible', icon: EyeOff, color: 'text-ark-ink-3', bgColor: 'bg-ark-ink-3' },
] as const

type StatusValue = typeof statusOptions[number]['value']

export function ProfilePopover({
  profile,
  isCurrentUser = false,
  children,
  side = 'bottom',
  align = 'start',
}: ProfilePopoverProps) {
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { preferences, updatePreference } = usePreferences()
  const { updateUserStatus } = useChat()

  const currentStatus = isCurrentUser
    ? (preferences?.online_status_preference as StatusValue) || 'online'
    : (profile.status as StatusValue) || 'offline'

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'online':
        return { icon: Circle, bgColor: 'bg-ark-good', label: 'Online' }
      case 'away':
        return { icon: Clock, bgColor: 'bg-ark-warn', label: 'Away' }
      case 'dnd':
        return { icon: MinusCircle, bgColor: 'bg-ark-crit', label: 'Do Not Disturb' }
      case 'invisible':
        return { icon: EyeOff, bgColor: 'bg-ark-ink-3', label: 'Invisible' }
      case 'suspended':
        return { icon: Ban, bgColor: 'bg-ark-crit', label: 'Suspended' }
      default:
        return { icon: Circle, bgColor: 'bg-ark-ink-3', label: 'Offline' }
    }
  }

  const handleStatusChange = async (newStatus: StatusValue) => {
    if (!isCurrentUser || isUpdating) return

    setIsUpdating(true)
    // Update both the preference (for persistence) and the user status (for immediate UI update)
    await Promise.all([
      updatePreference('online_status_preference', newStatus),
      updateUserStatus(newStatus),
    ])
    setIsUpdating(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-72 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div className="relative">
          {/* Banner gradient */}
          <div className="h-16 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-t-md" />

          {/* Avatar overlapping banner */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-popover">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(profile.display_name || profile.username)}
                </AvatarFallback>
              </Avatar>
              {(() => {
                const statusConfig = getStatusConfig(isCurrentUser ? currentStatus : profile.status)
                const StatusIcon = statusConfig.icon
                return (
                  <span className={cn(
                    'absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-popover',
                    statusConfig.bgColor
                  )}>
                    <StatusIcon className="h-3 w-3 text-white" />
                  </span>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-10 px-4 pb-3">
          <h3 className="font-semibold text-lg">
            {profile.display_name || profile.username}
          </h3>
          <p className="text-sm text-muted-foreground">
            @{profile.username}
          </p>

          {/* Status display for other users */}
          {!isCurrentUser && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {(() => {
                const statusConfig = getStatusConfig(profile.status)
                const StatusIcon = statusConfig.icon
                return (
                  <>
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', statusConfig.bgColor)}>
                      <StatusIcon className="h-2.5 w-2.5 text-white" />
                    </span>
                    {statusConfig.label}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Open Chat CTA for current user — always-available route back to the chat app */}
        {isCurrentUser && (
          <>
            <div className="border-t" />
            <div className="p-2">
              <Button
                asChild
                className="w-full justify-start gap-3"
                onClick={() => setOpen(false)}
              >
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4" />
                  Open Chat
                </Link>
              </Button>
            </div>
          </>
        )}

        {/* Status Selector for current user */}
        {isCurrentUser && (
          <>
            <div className="border-t" />
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Set Status
              </p>
              <div className="space-y-0.5">
                {statusOptions.map((status) => {
                  const Icon = status.icon
                  const isSelected = currentStatus === status.value

                  return (
                    <Button
                      key={status.value}
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      className={cn(
                        'w-full justify-start gap-3 h-9',
                        isSelected && 'bg-muted'
                      )}
                      onClick={() => handleStatusChange(status.value)}
                    >
                      <Icon className={cn('h-4 w-4', status.color)} />
                      <span className="flex-1 text-left">{status.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </Button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Bio if present */}
        {preferences?.bio && isCurrentUser && (
          <>
            <div className="border-t" />
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                About Me
              </p>
              <p className="text-sm">{preferences.bio}</p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
