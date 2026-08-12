import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// POST /api/widget/init — replaces widget-init edge function
export async function POST(request: NextRequest) {
  try {
    const { embedToken, origin } = await request.json()

    if (!embedToken) {
      return NextResponse.json({ error: 'embedToken is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Look up widget by embed token
    const { data: widget, error } = await supabase
      .from('widgets')
      .select('id, name, primary_color, position, welcome_message, offline_message, require_email, collect_name, allowed_origins, is_active, workspace_id')
      .eq('embed_token', embedToken)
      .eq('is_active', true)
      .single()

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found or inactive' }, { status: 404 })
    }

    // Verify origin if allowed_origins is set. A configured allowlist must NOT
    // be bypassable by simply omitting the origin. Trust the browser-set Origin
    // header over the body field (page JS cannot forge the header). A wildcard
    // entry ('*') opts out of the check entirely.
    const allowedOrigins = (widget.allowed_origins as string[] | null) || []
    if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
      const requestOrigin =
        request.headers.get('origin') || (typeof origin === 'string' ? origin : null)
      if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
        return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
      }
    }

    // Check if any workspace members are online (agents)
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', widget.workspace_id)

    let agentsOnline = false
    if (members && members.length > 0) {
      const memberIds = members.map((m: { user_id: string }) => m.user_id)
      const { data: onlineProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('id', memberIds)
        .eq('online_status', 'online')
        .limit(1)

      agentsOnline = (onlineProfiles?.length ?? 0) > 0
    }

    return NextResponse.json({
      widgetId: widget.id,
      name: widget.name,
      primaryColor: widget.primary_color,
      position: widget.position || 'bottom-right',
      welcomeMessage: widget.welcome_message,
      offlineMessage: widget.offline_message,
      requireEmail: widget.require_email,
      collectName: widget.collect_name,
      agentsOnline,
    })
  } catch (err) {
    console.error('Widget init error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
