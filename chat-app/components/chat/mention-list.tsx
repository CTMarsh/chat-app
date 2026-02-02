'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface MentionListProps {
  users: Profile[]
  selectedIndex: number
  onSelect: (user: Profile) => void
}

export function MentionList({ users, selectedIndex, onSelect }: MentionListProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (users.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 max-h-48 w-64 overflow-auto rounded-lg border bg-popover shadow-lg">
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
            index === selectedIndex && 'bg-accent'
          )}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(user.display_name || user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {user.display_name || user.username}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
