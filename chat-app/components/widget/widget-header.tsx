'use client'

import { MessageCircle, X } from 'lucide-react'

interface WidgetHeaderProps {
  title: string
  agentsOnline: boolean
  primaryColor: string
  isEnded?: boolean
  onClose?: () => void
}

export function WidgetHeader({ title, agentsOnline, primaryColor, isEnded, onClose }: WidgetHeaderProps) {
  return (
    <div
      className="px-4 py-3 flex items-center gap-3 shadow-sm"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h1 className="text-white font-semibold">{title}</h1>
        <div className="flex items-center gap-1.5">
          {isEnded ? (
            <span className="text-white/80 text-xs">Conversation ended</span>
          ) : (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  agentsOnline ? 'bg-ark-good' : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-white/80 text-xs">
                {agentsOnline ? 'Online' : 'Offline'}
              </span>
            </>
          )}
        </div>
      </div>
      {isEnded && onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  )
}
