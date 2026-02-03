'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useMessagePreferences } from '@/components/providers/preferences-provider'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

// Map preference values to emoji-mart skin tone numbers (1-6)
const skinToneMap: Record<string, number> = {
  'default': 1,
  'light': 2,
  'medium-light': 3,
  'medium': 4,
  'medium-dark': 5,
  'dark': 6,
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme } = useTheme()
  const { emojiSkinTone } = useMessagePreferences()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (emoji: { native: string }) => {
    onEmojiSelect(emoji.native)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '48px', height: '48px' }}
      >
        <Smile className="h-6 w-6 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-12 left-0 z-50"
        >
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="search"
            skin={skinToneMap[emojiSkinTone] || 1}
            maxFrequentRows={2}
            emojiSize={28}
            emojiButtonSize={36}
          />
        </div>
      )}
    </div>
  )
}
