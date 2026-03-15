import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// GET /api/widget/messages — replaces visitor-messages edge function
// Fetches messages for a widget conversation, with optional polling (after param)
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.nextUrl.searchParams.get('sessionToken')
    const conversationId = request.nextUrl.searchParams.get('conversationId')
    const after = request.nextUrl.searchParams.get('after')
    const statusOnly = request.nextUrl.searchParams.get('statusOnly')

    if (!sessionToken || !conversationId) {
      return NextResponse.json({ error: 'sessionToken and conversationId are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from('visitor_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Verify conversation belongs to this session
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, ended_at, visitor_session_id')
      .eq('id', conversationId)
      .eq('visitor_session_id', session.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Status-only check (for polling conversation end state)
    if (statusOnly === 'true') {
      return NextResponse.json({ ended_at: conversation.ended_at })
    }

    // Build messages query
    let query = supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        type,
        sender_id,
        visitor_name,
        visitor_email,
        sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Only get messages after a certain time (for polling)
    if (after) {
      query = query.gt('created_at', after)
    }

    const { data: messages, error: msgError } = await query

    if (msgError) {
      console.error('Failed to fetch messages:', msgError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Transform messages to widget format
    const formatted = (messages || []).map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.created_at,
      type: msg.type,
      isFromVisitor: !msg.sender_id,
      visitorName: msg.visitor_name,
      visitorEmail: msg.visitor_email,
      sender: msg.sender ? {
        id: (msg.sender as { id: string }).id,
        displayName: (msg.sender as { display_name: string }).display_name,
        avatarUrl: (msg.sender as { avatar_url: string }).avatar_url,
      } : undefined,
    }))

    return NextResponse.json({ messages: formatted })
  } catch (err) {
    console.error('Widget messages error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
