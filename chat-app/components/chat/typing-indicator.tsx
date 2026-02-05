'use client'

interface TypingIndicatorProps {
  userNames: string[]
}

export function TypingIndicator({ userNames }: TypingIndicatorProps) {
  const getText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`
    }
    if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`
    }
    return `${userNames[0]} and ${userNames.length - 1} others are typing...`
  }

  const text = getText()

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
      </div>
      <span className="text-xs font-medium">{text}</span>
    </div>
  )
}
