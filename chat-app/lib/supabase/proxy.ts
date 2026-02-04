import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getClaims() not getUser() per official documentation
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const publicRoutes = ['/login', '/signup', '/auth', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isLandingPage = request.nextUrl.pathname === '/'
  const isMFARoute = request.nextUrl.pathname.startsWith('/mfa')
  const isWidgetRoute = request.nextUrl.pathname.startsWith('/widget')
  const isWidgetApiRoute = request.nextUrl.pathname.startsWith('/api/widget')
  const isProtectedRoute = !isPublicRoute && !isLandingPage && !isMFARoute && !isWidgetRoute && !isWidgetApiRoute

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // For authenticated users, check MFA status
  if (user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const { data: factors } = await supabase.auth.mfa.listFactors()

    const hasVerifiedFactor = factors?.totp?.some(f => f.status === 'verified') ?? false
    const isAAL2 = aalData?.currentLevel === 'aal2'

    // Redirect from landing page
    if (isLandingPage) {
      const url = request.nextUrl.clone()
      if (!hasVerifiedFactor) {
        url.pathname = '/mfa/setup'
      } else if (!isAAL2) {
        url.pathname = '/mfa/verify'
      } else {
        url.pathname = '/chat'
      }
      return NextResponse.redirect(url)
    }

    // Allow MFA routes
    if (isMFARoute) {
      // If already at aal2, redirect to chat
      if (isAAL2 && hasVerifiedFactor) {
        const url = request.nextUrl.clone()
        url.pathname = '/chat'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // For protected routes, enforce MFA
    if (isProtectedRoute) {
      if (!hasVerifiedFactor) {
        // No MFA set up - redirect to setup
        const url = request.nextUrl.clone()
        url.pathname = '/mfa/setup'
        return NextResponse.redirect(url)
      }

      if (!isAAL2) {
        // Has MFA but not verified this session - redirect to verify
        const url = request.nextUrl.clone()
        url.pathname = '/mfa/verify'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
