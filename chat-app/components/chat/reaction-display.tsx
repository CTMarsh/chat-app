'use client'

import { cn } from '@/lib/utils'

interface ReactionGroup {
  emoji: string
  count: number
  users: string[]
  hasReacted: boolean
}

interface ReactionDisplayProps {
  reactions: ReactionGroup[]
  onToggleReaction: (emoji: string) => void
  isOwn: boolean
}

export function ReactionDisplay({ reactions, onToggleReaction, isOwn }: ReactionDisplayProps) {
  if (reactions.length === 0) return null

  return (
    <div className={cn('mt-1 flex flex-wrap gap-1', isOwn && 'justify-end')}>
      {reactions.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
            hasReacted
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-border bg-muted/50 hover:bg-muted'
          )}
        >
          <span>{emoji}</span>
          <span className="font-medium">{count}</span>
        </button>
      ))}
    </div>
  )
}
