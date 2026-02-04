import { NextRequest, NextResponse } from 'next/server'

// Public endpoint - no auth required
// Proxies to the Supabase edge function to get widget config
export async function GET(request: NextRequest) {
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
