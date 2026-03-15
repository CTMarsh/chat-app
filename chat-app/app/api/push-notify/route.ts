import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { conversationId, messageId, content, senderName } = await request.json()

    if (!conversationId || !messageId) {
      return NextResponse.json({ error: 'conversationId and messageId are required' }, { status: 400 })
    }

    // Get conversation info for collapse_id
    const title = `New message from ${senderName || 'someone'}`
    const body = content?.slice(0, 256) || ''

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
