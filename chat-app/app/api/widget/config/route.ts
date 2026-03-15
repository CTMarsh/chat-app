import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { RateLimiter } from '@/lib/utils/rate-limiter'

// Per-IP rate limiters for the public widget config endpoint
const ipLimiters = new Map<string, RateLimiter>()

function getRateLimiter(ip: string): RateLimiter {
  let limiter = ipLimiters.get(ip)
  if (!limiter) {
    // 10 requests burst, refill 1 per 6 seconds (10 per minute)
    limiter = new RateLimiter(10, 6)
    ipLimiters.set(ip, limiter)
    // Clean up old entries periodically (prevent memory leak)
    if (ipLimiters.size > 10000) {
      const firstKey = ipLimiters.keys().next().value
      if (firstKey) ipLimiters.delete(firstKey)
    }
  }
  return limiter
}

// Public endpoint - no auth required
// Queries widget config directly from database (replaces edge function proxy)
export async function GET(request: NextRequest) {
  // Rate limit by IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!getRateLimiter(clientIp).tryConsume()) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: widget, error } = await supabase
      .from('widgets')
      .select('name, primary_color, position')
      .eq('embed_token', token)
      .eq('is_active', true)
      .single()

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    return NextResponse.json({
      primaryColor: widget.primary_color,
      position: widget.position || 'bottom-right',
      name: widget.name
    })
  } catch (err) {
    console.error('Widget config error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
