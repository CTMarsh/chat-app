'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface MentionHighlightProps {
  content: string
  currentUserId?: string
}

export function MentionHighlight({ content, currentUserId }: MentionHighlightProps) {
  const parts = useMemo(() => {
    // Match @username patterns
    const mentionRegex = /@(\w+)/g
    const parts: { text: string; isMention: boolean; username?: string }[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push({
          text: content.slice(lastIndex, match.index),
          isMention: false,
        })
      }
      // Add the mention
      parts.push({
        text: match[0],
        isMention: true,
        username: match[1],
      })
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        text: content.slice(lastIndex),
        isMention: false,
      })
    }

    return parts
  }, [content])

  return (
    <>
      {parts.map((part, index) =>
        part.isMention ? (
          <span
            key={index}
            className={cn(
              'rounded bg-primary/20 px-0.5 font-medium text-primary'
            )}
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  )
}
