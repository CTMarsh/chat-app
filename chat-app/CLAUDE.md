# CLAUDE.md - Chat Application

This document provides context for Claude Code when working in this repository.

## Project Overview

A real-time chat application built with Next.js 16 and Supabase, featuring direct messages, group chats, file sharing, and mandatory MFA authentication.

**SECURITY IS THE #1 PRIORITY** - All changes must prioritize security. Never make RLS policies more permissive, never bypass MFA requirements, and always validate on the server side.

## Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Runtime**: React 19.2.3
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth with mandatory TOTP MFA (AAL2)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (avatars, message-attachments buckets)
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Theme**: next-themes for dark/light mode

## Project Structure

```
app/
  (protected)/           # Routes requiring authentication + MFA
    chat/
      layout.tsx         # Chat layout with sidebar
      page.tsx           # Conversation list / empty state
      [conversationId]/
        page.tsx         # Active conversation view
    settings/
      page.tsx           # User settings (profile, avatar)
  mfa/
    setup/page.tsx       # MFA enrollment (required for new users)
    verify/page.tsx      # MFA verification per session
  login/page.tsx
  signup/page.tsx
  forgot-password/page.tsx
  reset-password/page.tsx
  logout/page.tsx
  page.tsx               # Landing page

components/
  chat/                  # Chat-specific components
    chat-layout.tsx      # Main layout wrapper
    conversation-list.tsx
    conversation-item.tsx
    message-list.tsx
    message-item.tsx
    message-input.tsx
    chat-header.tsx
    typing-indicator.tsx
    user-search-dialog.tsx
    create-group-dialog.tsx
    emoji-picker.tsx
    file-upload-button.tsx
    file-message.tsx
    image-lightbox.tsx
    reaction-picker.tsx
    reaction-display.tsx
    mention-list.tsx
    mention-highlight.tsx
    pinned-messages-bar.tsx
    read-receipt-indicator.tsx
    search-dialog.tsx
    link-preview.tsx
    unread-badge.tsx
    notification-badge.tsx
    empty-state.tsx
  providers/
    chat-provider.tsx    # Global chat state (conversations, messages, typing)
    theme-provider.tsx   # Dark/light theme
  auth/
    mfa-enroll.tsx       # MFA setup component
    mfa-unenroll.tsx     # MFA removal component
  ui/                    # Reusable UI components (Radix-based)
  landing/               # Landing page components

lib/
  supabase/
    client.ts            # Browser Supabase client
    server.ts            # Server-side Supabase client (with cookies)
    proxy.ts             # Middleware for auth/MFA enforcement
  actions/
    conversations.ts     # Server actions for secure operations
  utils/
    scan-file.ts         # ClamAV virus scanning utility
  types/
    database.ts          # Generated Supabase TypeScript types
  utils.ts               # Utility functions (cn, etc.)
```

## Database Schema

All tables have RLS (Row Level Security) enabled:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `conversations` | Chat conversations (direct/group) |
| `conversation_participants` | User-conversation membership |
| `messages` | Chat messages with file support |
| `message_reactions` | Emoji reactions on messages |
| `message_mentions` | @mention tracking |
| `message_read_receipts` | Read receipt tracking |
| `notifications` | In-app notifications |

### Key RLS Helper Function

```sql
public.is_conversation_participant(conv_id uuid) → boolean
```

## Edge Functions

| Function | Purpose |
|----------|---------|
| `scan-file` | ClamAV virus scanning for uploads |
| `get-link-preview` | Fetch URL metadata for link previews |

## Authentication Flow

1. User signs up/logs in
2. **MFA Setup Required**: New users must enroll TOTP authenticator
3. **MFA Verify Required**: Each session requires TOTP verification
4. Only after reaching AAL2 can users access `/chat/*` routes
5. Middleware (`proxy.ts`) enforces this at the route level

## Security Patterns

### Server Actions for Sensitive Operations

Use server actions (in `lib/actions/`) for database mutations:

```typescript
'use server'
export async function createDirectConversation(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Always verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }
  // ... proceed with operation
}
```

### File Upload Security

1. Client-side: File type and size validation (50MB max)
2. Server-side: ClamAV virus scanning via Edge Function
3. Storage: Private bucket with signed URLs

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Generate Supabase types
npx supabase gen types typescript --project-id <project-id> > lib/types/database.ts
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Edge Function secrets (set via `supabase secrets set`):
- `CLAMAV_API_URL` - Optional ClamAV REST API endpoint

## Key Dependencies

- `@supabase/ssr` - Supabase SSR client
- `@emoji-mart/react` - Emoji picker
- `react-dropzone` - File upload
- `next-themes` - Theme switching
- `date-fns` - Date formatting
- `use-debounce` - Search debouncing
- `lucide-react` - Icons

## Features

1. **Direct Messages** - 1:1 private conversations
2. **Group Chats** - Multi-user conversations with admin roles
3. **Real-time Messaging** - Instant message delivery
4. **Typing Indicators** - See when others are typing
5. **Online Presence** - User status (online/offline/away)
6. **File Sharing** - Images and files with virus scanning
7. **Message Reactions** - Emoji reactions
8. **Message Replies** - Reply to specific messages
9. **Message Deletion** - Soft delete own messages
10. **@Mentions** - Tag users in group chats
11. **Pinned Messages** - Pin important messages
12. **Read Receipts** - See who has read messages
13. **Message Search** - Full-text search
14. **Link Previews** - Auto-preview URLs
15. **Unread Badges** - Per-conversation unread counts
16. **Dark/Light Theme** - System preference detection
17. **Avatar Upload** - Profile picture upload
18. **Mandatory MFA** - TOTP authentication required

## Important Notes

- **Never** make RLS policies more permissive to fix bugs
- **Always** verify MFA (AAL2) before sensitive operations
- **Use** server actions for database mutations, not client-side queries
- **Validate** user input on the server, not just the client
- The middleware in `proxy.ts` handles auth flow and MFA enforcement
- Real-time subscriptions are managed in `chat-provider.tsx`
