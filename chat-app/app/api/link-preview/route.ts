import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchWithSsrfGuard } from '@/lib/utils/ssrf'

// POST /api/link-preview — replaces get-link-preview edge function
// Fetches URL metadata (title, description, image, site name) server-side
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ url })
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ url })
    }

    // Fetch the URL with a timeout. SSRF guard resolves the host and rejects
    // private/loopback/link-local targets, re-validating on every redirect hop
    // (redirect: 'manual') so a public URL can't 302 to an internal one.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetchWithSsrfGuard(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ChatArk-LinkPreview/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return NextResponse.json({ url })
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        return NextResponse.json({ url })
      }

      // Read only the first 50KB to avoid memory issues
      const reader = response.body?.getReader()
      if (!reader) return NextResponse.json({ url })

      let html = ''
      const decoder = new TextDecoder()
      let bytesRead = 0
      const maxBytes = 50000

      while (bytesRead < maxBytes) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        bytesRead += value.length
      }
      reader.cancel()

      // Extract Open Graph and meta tags
      const title = extractMeta(html, 'og:title') || extractTag(html, 'title')
      const description = extractMeta(html, 'og:description') || extractMeta(html, 'description')
      const image = extractMeta(html, 'og:image')
      const siteName = extractMeta(html, 'og:site_name')

      return NextResponse.json({
        url,
        title: title?.slice(0, 300),
        description: description?.slice(0, 500),
        image: image?.slice(0, 2000),
        siteName: siteName?.slice(0, 200),
      })
    } catch {
      clearTimeout(timeout)
      return NextResponse.json({ url })
    }
  } catch (err) {
    console.error('Link preview error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function extractMeta(html: string, property: string): string | null {
  // Try property attribute (Open Graph)
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*property=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`, 'i')
  )
  if (ogMatch) return decodeHtmlEntities(ogMatch[1])

  // Try content before property
  const ogMatch2 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${escapeRegex(property)}["']`, 'i')
  )
  if (ogMatch2) return decodeHtmlEntities(ogMatch2[1])

  // Try name attribute (standard meta)
  const nameMatch = html.match(
    new RegExp(`<meta[^>]*name=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`, 'i')
  )
  if (nameMatch) return decodeHtmlEntities(nameMatch[1])

  const nameMatch2 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escapeRegex(property)}["']`, 'i')
  )
  if (nameMatch2) return decodeHtmlEntities(nameMatch2[1])

  return null
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
  return match ? decodeHtmlEntities(match[1].trim()) : null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}
