import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'

  // Validate redirect path to prevent open redirects
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://') ? rawNext : '/'

  // Behind Traefik/cloudflared the request URL's origin is the internal bind
  // (http://0.0.0.0:3000), which the browser refuses as a "restricted network
  // port". Build the PUBLIC origin from the forwarded host so the post-login
  // redirect lands on chat.noahsark.me. Fall back to the request origin only
  // when no proxy header is present (e.g. local dev on localhost).
  const fwdHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const fwdProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const publicOrigin =
    fwdHost && !fwdHost.startsWith('0.0.0.0') && !fwdHost.startsWith('localhost') && !fwdHost.startsWith('127.')
      ? `${fwdProto}://${fwdHost}`
      : origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${publicOrigin}${next}`)
    }
  }

  // Return to home page on error
  return NextResponse.redirect(`${publicOrigin}`)
}
