import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { allowRequest, getClientIp } from '@/lib/utils/ip-rate-limit'
import { isSessionExpired } from '@/lib/utils/widget-auth'
import { randomUUID } from 'crypto'

// POST /api/widget/session — replaces visitor-session edge function
// Handles both session creation and session resume
export async function POST(request: NextRequest) {
  try {
    // Rate limit writes by IP (session create + resume).
    const clientIp = getClientIp(request)
    if (!allowRequest('widget-session', clientIp, 10, 6)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const body = await request.json()
    const { embedToken, sessionToken, email, name } = body

    if (!embedToken) {
      return NextResponse.json({ error: 'embedToken is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Validate widget exists and is active
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('id, is_active')
      .eq('embed_token', embedToken)
      .eq('is_active', true)
      .single()

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Widget not found or inactive' }, { status: 404 })
    }

    // Resume existing session
    if (sessionToken) {
      const { data: existingSession, error: sessionError } = await supabase
        .from('visitor_sessions')
        .select('id, email, name, session_token, widget_id, expires_at')
        .eq('session_token', sessionToken)
        .eq('widget_id', widget.id)
        .single()

      if (sessionError || !existingSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      // Reject expired sessions on resume.
      if (isSessionExpired(existingSession.expires_at)) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      // Update last_seen_at
      await supabase
        .from('visitor_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existingSession.id)

      // Find existing conversation for this session
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('visitor_session_id', existingSession.id)
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        sessionToken: existingSession.session_token,
        sessionId: existingSession.id,
        email: existingSession.email,
        name: existingSession.name,
        conversationId: conversation?.id || null,
      })
    }

    // Create new session
    if (!email) {
      return NextResponse.json({ error: 'email is required for new sessions' }, { status: 400 })
    }

    const newToken = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h

    const { data: newSession, error: createError } = await supabase
      .from('visitor_sessions')
      .insert({
        widget_id: widget.id,
        email,
        name: name || 'Visitor',
        session_token: newToken,
        expires_at: expiresAt,
      })
      .select('id, email, name, session_token')
      .single()

    if (createError || !newSession) {
      console.error('Failed to create visitor session:', createError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionToken: newSession.session_token,
      sessionId: newSession.id,
      email: newSession.email,
      name: newSession.name,
      conversationId: null,
    })
  } catch (err) {
    console.error('Widget session error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
