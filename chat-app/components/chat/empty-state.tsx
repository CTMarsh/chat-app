'use client'

import { MessageSquare, Sparkles } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative">
        {/* Icon with gradient background */}
        <div className="relative mx-auto">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-xl shadow-primary/10">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold tracking-tight">Welcome to Chat</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>

        {/* Feature hints */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['Direct Messages', 'Group Chats', 'File Sharing', 'Reactions'].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
