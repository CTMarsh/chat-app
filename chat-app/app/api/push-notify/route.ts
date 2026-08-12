import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const NOTIFY_URL = process.env.NOTIFY_URL || 'https://notify.noahsark.me'
const NOTIFY_API_KEY = process.env.NOTIFY_API_KEY || ''

// POST /api/push-notify — sends push notification via Notify service
// Called fire-and-forget after message insert
export async function POST(request: NextRequest) {
  try {
    if (!NOTIFY_API_KEY) {
      return NextResponse.json({ skipped: true, reason: 'NOTIFY_API_KEY not configured' })
    }

    // Require authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only the identifiers are trusted from the request. Title/body/senderName
    // are derived from the DB row so a caller can't spoof notification content.
    const { conversationId, messageId } = await request.json()

    if (!conversationId || !messageId) {
      return NextResponse.json({ error: 'conversationId and messageId are required' }, { status: 400 })
    }

    // Authorize + resolve content server-side with the service role, enforcing
    // the participant check ourselves (independent of RLS read policies).
    const admin = createServiceRoleClient()

    // The caller must be a participant of the conversation (prevents IDOR:
    // triggering a push to a conversation they aren't in).
    const { data: participant } = await admin
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // The message must exist and belong to this conversation.
    const { data: message } = await admin
      .from('messages')
      .select('id, content, sender_id, visitor_name')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Derive sender display name from the DB (never from the request).
    let senderName = 'someone'
    if (message.sender_id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('display_name')
        .eq('id', message.sender_id)
        .maybeSingle()
      senderName = profile?.display_name || 'someone'
    } else if (message.visitor_name) {
      senderName = message.visitor_name
    }

    const title = `New message from ${senderName}`
    const body = message.content?.slice(0, 256) || ''

    const response = await fetch(`${NOTIFY_URL}/api/webhook/chatark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': NOTIFY_API_KEY,
      },
      body: JSON.stringify({
        title,
        body,
        data: {
          conversation_id: conversationId,
          message_id: messageId,
          sender_id: user.id,
        },
        priority: 'high',
        collapse_id: conversationId,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Notify webhook error:', response.status, err)
      return NextResponse.json({ sent: false, error: 'Notify webhook failed' })
    }

    const result = await response.json()
    return NextResponse.json({ sent: true, ...result })
  } catch (err) {
    console.error('Push notify error:', err)
    return NextResponse.json({ sent: false, error: 'Internal error' })
  }
}
