'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useChat } from '@/components/providers/chat-provider'
import type { MessageWithSender } from '@/lib/types/database'

interface SearchDialogProps {
  trigger?: React.ReactNode
}

export function SearchDialog({ trigger }: SearchDialogProps) {
  const { activeConversation } = useChat()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !activeConversation) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', activeConversation.id)
        .is('deleted_at', null)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setResults((data as MessageWithSender[]) || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, activeConversation])

  useEffect(() => {
    search(debouncedQuery)
  }, [debouncedQuery, search])

  const handleResultClick = (messageId: string) => {
    setOpen(false)
    // Scroll to message
    setTimeout(() => {
      const element = document.getElementById(`message-${messageId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('bg-primary/10')
        setTimeout(() => {
          element.classList.remove('bg-primary/10')
        }, 2000)
      }
    }, 100)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Safe highlight component that doesn't use dangerouslySetInnerHTML
  const HighlightedText = ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <p className="line-clamp-2 text-sm text-muted-foreground">{text}</p>

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))

    return (
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-ark-amber/30 dark:bg-ark-amber/25 rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden border-border/50 bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:max-w-[500px]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search in this conversation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-border/50 bg-background/50 pl-9 pr-9 transition-all focus:border-primary/30 focus:shadow-lg focus:shadow-primary/5"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="max-h-[50vh] overflow-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && query && results.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No messages found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-2" role="listbox" aria-label="Search results">
                {results.map((message) => (
                  <button
                    key={message.id}
                    role="option"
                    aria-selected={false}
                    onClick={() => handleResultClick(message.id)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 p-3 text-left transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/10 ring-offset-1 ring-offset-background">
                        <AvatarImage src={message.sender.avatar_url || undefined} alt={`${message.sender.display_name || message.sender.username}'s avatar`} />
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {getInitials(message.sender.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.sender.display_name || message.sender.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.created_at && format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <HighlightedText text={message.content} query={query} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && !query && (
              <div className="py-8 text-center text-muted-foreground">
                Start typing to search messages
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
