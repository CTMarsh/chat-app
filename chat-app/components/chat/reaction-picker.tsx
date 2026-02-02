'use client'

import { useState } from 'react'
import { SmilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

interface ReactionPickerProps {
  onReact: (emoji: string) => void
  existingReactions?: string[]
}

export function ReactionPicker({ onReact, existingReactions = [] }: ReactionPickerProps) {
  const [open, setOpen] = useState(false)

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
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <div className="flex gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`rounded p-1.5 text-lg transition-colors hover:bg-muted ${
                existingReactions.includes(emoji) ? 'bg-primary/20' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
