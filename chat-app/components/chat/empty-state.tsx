'use client'

import { MessageSquare } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-6">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Welcome to Chat</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Select a conversation from the sidebar or start a new chat to begin messaging.
      </p>
    </div>
  )
}
