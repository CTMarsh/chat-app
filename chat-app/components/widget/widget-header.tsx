'use client'

import { MessageCircle } from 'lucide-react'

interface WidgetHeaderProps {
  title: string
  agentsOnline: boolean
  primaryColor: string
}

export function WidgetHeader({ title, agentsOnline, primaryColor }: WidgetHeaderProps) {
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
          <span
            className={`w-2 h-2 rounded-full ${
              agentsOnline ? 'bg-green-400' : 'bg-gray-300'
            }`}
          />
          <span className="text-white/80 text-xs">
            {agentsOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  )
}
