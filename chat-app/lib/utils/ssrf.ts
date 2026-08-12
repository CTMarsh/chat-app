import { lookup } from 'node:dns/promises'

/**
 * SSRF guard for server-side fetches of user-supplied URLs (e.g. link previews).
 *
 * Blocks requests whose host resolves to a private, loopback, link-local, or
 * otherwise-reserved address, and re-validates on every redirect hop so a public
 * URL cannot 302 to an internal one.
 *
 * Node.js runtime only (uses node:dns) — do NOT import from an edge route.
 */

export class SsrfBlockedError extends Error {
  constructor(public reason: string) {
    super(`SSRF blocked: ${reason}`)
    this.name = 'SsrfBlockedError'
  }
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')
}

/**
 * True if `ip` is in a private/reserved/loopback/link-local range and must not
 * be reachable from a public-URL fetch. Conservative: unparseable input blocks.
 */
export function isBlockedAddress(ip: string): boolean {
  let addr = ip.trim().toLowerCase()

  // Unwrap IPv4-mapped IPv6 (::ffff:10.0.0.1) and route to the IPv4 checks.
  const mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) addr = mapped[1]

  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(addr)) {
    const parts = addr.split('.').map((p) => Number(p))
    if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true
    const [a, b] = parts
    if (a === 0) return true                     // 0.0.0.0/8 "this host"
    if (a === 10) return true                    // 10.0.0.0/8
    if (a === 127) return true                   // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true      // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
    if (a === 192 && b === 168) return true      // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
    if (a >= 224) return true                    // 224.0.0.0/3 multicast + reserved
    return false
  }

  // IPv6
  if (addr === '::' || addr === '::1') return true                 // unspecified + loopback
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true  // fc00::/7 unique-local
  if (/^fe[89ab]/.test(addr)) return true                          // fe80::/10 link-local
  if (addr.startsWith('ff')) return true                           // ff00::/8 multicast

  // Anything else that failed to look like a routable IP is blocked defensively.
  if (!addr.includes(':')) return true
  return false
}

/**
 * Validate a URL's protocol and resolve its host, throwing SsrfBlockedError if
 * the protocol is not http(s) or any resolved address is private/reserved.
 * Returns the parsed URL on success.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl)

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfBlockedError('protocol')
  }

  const host = parsed.hostname // URL strips the [] from IPv6 literals

  if (isIpLiteral(host)) {
    if (isBlockedAddress(host)) throw new SsrfBlockedError('literal-ip')
    return parsed
  }

  let results: Array<{ address: string; family: number }>
  try {
    results = await lookup(host, { all: true, verbatim: true })
  } catch {
    throw new SsrfBlockedError('dns-failure')
  }
  if (!results.length) throw new SsrfBlockedError('no-dns')
  for (const r of results) {
    if (isBlockedAddress(r.address)) throw new SsrfBlockedError('private-dns')
  }
  return parsed
}

interface SafeFetchOptions {
  signal?: AbortSignal
  headers?: Record<string, string>
  maxRedirects?: number
}

/**
 * fetch() with an SSRF guard on the initial URL and on every redirect target.
 * Redirects are followed manually (`redirect: 'manual'`) so each hop is
 * re-validated; a public URL cannot bounce to an internal one.
 */
export async function fetchWithSsrfGuard(
  startUrl: string,
  { signal, headers, maxRedirects = 4 }: SafeFetchOptions = {}
): Promise<Response> {
  let current = startUrl
  for (let hop = 0; ; hop++) {
    await assertPublicUrl(current)
    const res = await fetch(current, { signal, headers, redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return res
      if (hop >= maxRedirects) throw new SsrfBlockedError('too-many-redirects')
      current = new URL(loc, current).toString()
      continue
    }
    return res
  }
}
