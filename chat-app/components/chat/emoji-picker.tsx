'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme } = useTheme()

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
            skinTonePosition="none"
            maxFrequentRows={2}
            emojiSize={28}
            emojiButtonSize={36}
          />
        </div>
      )}
    </div>
  )
}
