'use client'

import { useState, useMemo } from 'react'
import { SmilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useMessagePreferences } from '@/components/providers/preferences-provider'

// Thumbs up with skin tone variants
const THUMBS_UP_VARIANTS: Record<string, string> = {
  'default': '👍',
  'light': '👍🏻',
  'medium-light': '👍🏼',
  'medium': '👍🏽',
  'medium-dark': '👍🏾',
  'dark': '👍🏿',
}

// Base reactions (non-skin-tone emojis stay the same)
const BASE_REACTIONS = ['❤️', '😂', '😮', '😢', '😡']

interface ReactionPickerProps {
  onReact: (emoji: string) => void
  existingReactions?: string[]
}

export function ReactionPicker({ onReact, existingReactions = [] }: ReactionPickerProps) {
  const [open, setOpen] = useState(false)
  const { emojiSkinTone } = useMessagePreferences()

  // Build reactions with correct skin tone for thumbs up
  const quickReactions = useMemo(() => {
    const thumbsUp = THUMBS_UP_VARIANTS[emojiSkinTone] || '👍'
    return [thumbsUp, ...BASE_REACTIONS]
  }, [emojiSkinTone])

  const handleReact = (emoji: string) => {
    onReact(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Add reaction"
        >
          <SmilePlus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <div className="flex gap-1" role="group" aria-label="Quick reactions">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`rounded p-1.5 text-lg transition-colors hover:bg-muted ${
                existingReactions.includes(emoji) ? 'bg-primary/20' : ''
              }`}
              aria-label={`React with ${emoji}`}
              aria-pressed={existingReactions.includes(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
