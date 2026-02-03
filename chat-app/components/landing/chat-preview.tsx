'use client'

import { Check, CheckCheck, Heart, ThumbsUp } from 'lucide-react'

// Mock data for the preview
const mockConversations = [
  {
    id: 1,
    name: 'Daniel M',
    avatar: 'DM',
    lastMessage: 'That sounds great! Let me know...',
    time: '2m',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: 'Dev Team',
    avatar: 'DT',
    lastMessage: 'Alex: Updated the mockups',
    time: '15m',
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: 3,
    name: 'Jimmy Johnson',
    avatar: 'JJ',
    lastMessage: 'See you tomorrow!',
    time: '1h',
    unread: 0,
    online: true,
  },
]

const mockMessages = [
  {
    id: 1,
    sender: 'Daniel M',
    avatar: 'DM',
    content: 'Hey! Have you seen the new feature updates?',
    time: '10:32 AM',
    isOwn: false,
  },
  {
    id: 2,
    sender: 'You',
    avatar: 'YO',
    content: 'Yes! The real-time sync is amazing 🚀',
    time: '10:33 AM',
    isOwn: true,
    reactions: [{ emoji: '❤️', count: 1 }],
  },
  {
    id: 3,
    sender: 'Daniel M',
    avatar: 'DM',
    content: 'Right? And the new emoji reactions make conversations so much more fun!',
    time: '10:34 AM',
    isOwn: false,
    reactions: [{ emoji: '👍', count: 1 }, { emoji: '😄', count: 1 }],
  },
  {
    id: 4,
    sender: 'You',
    avatar: 'YO',
    content: "Let's schedule a call to discuss the roadmap",
    time: '10:35 AM',
    isOwn: true,
    read: true,
  },
]

export function ChatPreview() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg bg-background text-sm">
      {/* Mini Sidebar */}
      <div className="hidden sm:flex w-[140px] flex-col border-r bg-card/50">
        {/* Sidebar Header */}
        <div className="border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              YO
            </div>
            <span className="text-xs font-medium truncate">Your Name</span>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden py-1">
          {mockConversations.map((conv, i) => (
            <div
              key={conv.id}
              className={`flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors ${
                i === 0 ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  conv.isGroup
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary'
                }`}>
                  {conv.avatar}
                </div>
                {conv.online && !conv.isGroup && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium truncate">{conv.name}</span>
                  <span className="text-[9px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <div className="relative">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
              DM
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
          </div>
          <div>
            <p className="text-xs font-medium">Daniel M</p>
            <p className="text-[10px] text-green-600">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden p-2 space-y-2">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-1.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
            >
              {!msg.isOwn && (
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-[8px] font-medium text-primary flex-shrink-0">
                  {msg.avatar}
                </div>
              )}
              <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                <div
                  className={`rounded-xl px-2.5 py-1.5 max-w-[180px] ${
                    msg.isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-[11px] leading-relaxed">{msg.content}</p>
                </div>
                {msg.reactions && (
                  <div className={`flex gap-0.5 mt-0.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                    {msg.reactions.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px]"
                      >
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                  {msg.isOwn && msg.read && (
                    <CheckCheck className="h-2.5 w-2.5 text-primary" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
            <span className="text-[11px] text-muted-foreground flex-1">Type a message...</span>
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <svg className="h-2.5 w-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
