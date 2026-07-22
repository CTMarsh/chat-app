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
        // Constellation amber — the warm highlight is reserved for key numbers
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-ark-amber/15 px-1.5 font-mono text-xs font-semibold tabular-nums text-ark-warn',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
