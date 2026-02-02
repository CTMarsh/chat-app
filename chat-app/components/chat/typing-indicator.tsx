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

  return (
    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="animate-bounce [animation-delay:-0.3s]">.</span>
        <span className="animate-bounce [animation-delay:-0.15s]">.</span>
        <span className="animate-bounce">.</span>
      </div>
      <span>{getText()}</span>
    </div>
  )
}
