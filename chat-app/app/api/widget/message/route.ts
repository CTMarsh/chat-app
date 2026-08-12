import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { allowRequest, getClientIp } from '@/lib/utils/ip-rate-limit'

// POST /api/widget/message — replaces visitor-message edge function
// Sends a message from a widget visitor
export async function POST(request: NextRequest) {
  try {
    // Rate limit message writes by IP.
    const clientIp = getClientIp(request)
    if (!allowRequest('widget-message', clientIp, 30, 2)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { sessionToken, content, conversationId } = await request.json()

    if (!sessionToken || !content?.trim()) {
      return NextResponse.json({ error: 'sessionToken and content are required' }, { status: 400 })
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: 'Message too long (max 10000 characters)' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from('visitor_sessions')
      .select('id, email, name, widget_id, expires_at')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Reject expired sessions.
    if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Get or create conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      // Get the widget to find the workspace
      const { data: widget } = await supabase
        .from('widgets')
        .select('id, workspace_id')
        .eq('id', session.widget_id)
        .single()

      if (!widget) {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
      }

      // Create a new widget conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'widget',
          name: `Chat with ${session.name}`,
          visitor_session_id: session.id,
          widget_id: widget.id,
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        console.error('Failed to create conversation:', convError)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }

      activeConversationId = newConv.id

      // Add workspace members as participants
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', widget.workspace_id)

      if (members && members.length > 0) {
        const participants = members.map((m: { user_id: string }) => ({
          conversation_id: activeConversationId,
          user_id: m.user_id,
          role: 'member',
        }))

        await supabase.from('conversation_participants').insert(participants)
      }
    } else {
      // Verify conversation belongs to this session
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, ended_at')
        .eq('id', activeConversationId)
        .eq('visitor_session_id', session.id)
        .single()

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (conv.ended_at) {
        return NextResponse.json({ error: 'Conversation has ended' }, { status: 400 })
      }
    }

    // Insert visitor message (no sender_id — marks as visitor message)
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        content: content.trim(),
        type: 'text',
        visitor_name: session.name,
        visitor_email: session.email,
      })
      .select('id, content, created_at')
      .single()

    if (msgError || !message) {
      console.error('Failed to send message:', msgError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId)

    // Update session last_seen_at
    await supabase
      .from('visitor_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id)

    return NextResponse.json({
      messageId: message.id,
      content: message.content,
      createdAt: message.created_at,
      conversationId: activeConversationId,
      visitorName: session.name,
      visitorEmail: session.email,
    })
  } catch (err) {
    console.error('Widget message error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
