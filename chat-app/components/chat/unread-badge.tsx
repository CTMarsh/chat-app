'use client'

import { cn } from '@/lib/utils'

interface UnreadBadgeProps {
  count: number
  className?: string
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
