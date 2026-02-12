import { NextRequest, NextResponse } from 'next/server'
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
// Proxies to the Supabase edge function to get widget config
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    // Call the existing widget-init edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/widget-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedToken: token,
        origin: request.headers.get('origin') || '*'
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    const widgetConfig = await response.json()

    // Return only the config needed for the button styling
    return NextResponse.json({
      primaryColor: widgetConfig.primaryColor,
      position: widgetConfig.position || 'bottom-right',
      name: widgetConfig.name
    })
  } catch (err) {
    console.error('Widget config error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
