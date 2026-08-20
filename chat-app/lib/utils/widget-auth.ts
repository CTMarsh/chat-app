/**
 * Pure authorization predicates for the unauthenticated widget surface.
 *
 * These were inline in the route handlers, which made them impossible to test
 * without standing up Supabase. They are pure so the rules can be pinned.
 */

/**
 * Decide whether a widget embed request may proceed, given the widget's
 * configured `allowed_origins`.
 *
 * Rules:
 *  - An empty/absent allowlist means the widget is unrestricted.
 *  - A `'*'` entry opts out of the check entirely.
 *  - Otherwise the origin must be present AND listed. Omitting the origin must
 *    NOT bypass a configured allowlist — that was the original bug.
 *  - The browser-set `Origin` header wins over the body-supplied value, because
 *    page JavaScript cannot forge the header but can put anything in the body.
 */
export function isOriginAllowed(
  allowedOrigins: string[] | null | undefined,
  headerOrigin: string | null | undefined,
  bodyOrigin?: unknown
): boolean {
  const allowlist = allowedOrigins ?? []
  if (allowlist.length === 0) return true
  if (allowlist.includes('*')) return true

  const requestOrigin =
    headerOrigin || (typeof bodyOrigin === 'string' && bodyOrigin ? bodyOrigin : null)
  if (!requestOrigin) return false

  return allowlist.includes(requestOrigin)
}

/**
 * True if a visitor session's `expires_at` is in the past and the session must
 * be refused. A null/absent `expires_at` means "no expiry configured" and is
 * treated as live, matching the DB column being nullable.
 *
 * An unparseable timestamp is treated as EXPIRED — failing closed is the only
 * safe reading of a corrupt expiry.
 */
export function isSessionExpired(
  expiresAt: string | number | Date | null | undefined,
  now: number = Date.now()
): boolean {
  if (expiresAt === null || expiresAt === undefined || expiresAt === '') return false
  const ts = new Date(expiresAt).getTime()
  if (Number.isNaN(ts)) return true
  return ts <= now
}
