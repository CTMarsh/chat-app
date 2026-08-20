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

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/

/**
 * Strip the brackets WHATWG `URL.hostname` keeps around IPv6 literals
 * (`new URL('http://[::1]/').hostname === '[::1]'`) plus any scope/zone id,
 * and lower-case. Everything downstream assumes a bare address.
 */
function normalizeHost(host: string): string {
  let h = host.trim().toLowerCase()
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)
  const zone = h.indexOf('%')
  if (zone !== -1) h = h.slice(0, zone)
  return h
}

function isIpLiteral(host: string): boolean {
  const h = normalizeHost(host)
  return IPV4_RE.test(h) || h.includes(':')
}

/** True if the dotted-quad octets are in a private/reserved IPv4 range. */
function isBlockedIpv4(parts: number[]): boolean {
  if (parts.length !== 4) return true
  if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true
  const [a, b] = parts
  if (a === 0) return true                          // 0.0.0.0/8 "this host"
  if (a === 10) return true                         // 10.0.0.0/8
  if (a === 127) return true                        // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true           // 169.254.0.0/16 link-local
  if (a === 172 && b >= 16 && b <= 31) return true  // 172.16.0.0/12
  if (a === 192 && b === 168) return true           // 192.168.0.0/16
  if (a === 192 && b === 0) return true             // 192.0.0.0/24 IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
  if (a >= 224) return true                         // 224.0.0.0/3 multicast + reserved
  return false
}

/**
 * Expand an IPv6 string to its 8 16-bit groups, handling `::` compression and a
 * dotted-quad tail (`::ffff:127.0.0.1`). Returns null if it is not a valid IPv6
 * address — callers treat null as "block".
 */
function parseIpv6(input: string): number[] | null {
  let s = input

  // Embedded IPv4 tail — rewrite the dotted quad into two hex groups.
  const v4tail = s.match(/^(.*:)((?:\d{1,3}\.){3}\d{1,3})$/)
  if (v4tail) {
    const o = v4tail[2].split('.').map(Number)
    if (o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
    const hi = ((o[0] << 8) | o[1]).toString(16)
    const lo = ((o[2] << 8) | o[3]).toString(16)
    s = `${v4tail[1]}${hi}:${lo}`
  }

  if (!/^[0-9a-f:]+$/.test(s)) return null

  const halves = s.split('::')
  if (halves.length > 2) return null

  const toGroups = (chunk: string): number[] | null => {
    if (chunk === '') return []
    const out: number[] = []
    for (const g of chunk.split(':')) {
      if (g === '' || g.length > 4) return null
      const n = parseInt(g, 16)
      if (Number.isNaN(n)) return null
      out.push(n)
    }
    return out
  }

  const head = toGroups(halves[0])
  if (head === null) return null

  if (halves.length === 1) return head.length === 8 ? head : null

  const tail = toGroups(halves[1])
  if (tail === null) return null
  const fill = 8 - head.length - tail.length
  if (fill < 1) return null
  return [...head, ...new Array<number>(fill).fill(0), ...tail]
}

/** The four IPv4 octets embedded in two consecutive groups of an IPv6 address. */
function embeddedIpv4(g: number[], hiIndex: number): number[] {
  return [g[hiIndex] >> 8, g[hiIndex] & 0xff, g[hiIndex + 1] >> 8, g[hiIndex + 1] & 0xff]
}

function isBlockedIpv6(g: number[]): boolean {
  const leadingZeros = (n: number) => g.slice(0, n).every((x) => x === 0)

  // :: (unspecified) and ::1 (loopback)
  if (leadingZeros(7) && (g[7] === 0 || g[7] === 1)) return true

  // ::ffff:a.b.c.d (IPv4-mapped) and ::a.b.c.d (IPv4-compatible, deprecated).
  // WHATWG URL re-serialises `::ffff:127.0.0.1` as `::ffff:7f00:1`, so this has
  // to work on the hex form, not just the dotted one.
  if (leadingZeros(5) && (g[5] === 0xffff || g[5] === 0)) {
    return isBlockedIpv4(embeddedIpv4(g, 6))
  }

  // 64:ff9b::/96 — NAT64 well-known prefix, embeds an IPv4 destination.
  if (g[0] === 0x0064 && g[1] === 0xff9b) return isBlockedIpv4(embeddedIpv4(g, 6))

  // 2002::/16 — 6to4, embeds the IPv4 in groups 1-2.
  if (g[0] === 0x2002) return isBlockedIpv4(embeddedIpv4(g, 1))

  if ((g[0] & 0xfe00) === 0xfc00) return true // fc00::/7 unique-local
  if ((g[0] & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return true // ff00::/8 multicast
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true // 100::/64 discard

  return false
}

/**
 * True if `ip` is in a private/reserved/loopback/link-local range and must not
 * be reachable from a public-URL fetch. Conservative: unparseable input blocks.
 *
 * Accepts bracketed IPv6 literals (`[::1]`) because that is exactly what
 * `URL.hostname` hands back.
 */
export function isBlockedAddress(ip: string): boolean {
  const addr = normalizeHost(ip)
  if (addr === '') return true

  if (IPV4_RE.test(addr)) return isBlockedIpv4(addr.split('.').map(Number))

  if (addr.includes(':')) {
    const groups = parseIpv6(addr)
    if (groups === null) return true
    return isBlockedIpv6(groups)
  }

  // Anything else that failed to look like a routable IP is blocked defensively.
  return true
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

  const host = normalizeHost(parsed.hostname)

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
