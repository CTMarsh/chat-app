'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SkipLink } from '@/components/ui/skip-link'
import { ConversationList } from './conversation-list'
import { useChat } from '@/components/providers/chat-provider'

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isLoading } = useChat()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ark-line border-t-ark-blue" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading&hellip;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ark-texture flex h-screen overflow-hidden bg-background">
      <SkipLink href="main-content">Skip to main content</SkipLink>

      {/* Desktop sidebar */}
      <aside className="hidden w-80 flex-shrink-0 border-r md:block" aria-label="Conversations sidebar">
        <ConversationList />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 z-50 md:hidden"
            aria-label="Open conversations menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0" aria-label="Conversations">
          {/* Radix Dialog requires a title for a11y; visually hidden since the
              drawer's own header already labels it. */}
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <ConversationList onSelect={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
