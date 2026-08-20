import { describe, it, expect } from 'vitest'
import { isOriginAllowed, isSessionExpired } from '../widget-auth'

const ALLOW = ['https://acme.example', 'https://shop.acme.example']

describe('isOriginAllowed — unrestricted widgets', () => {
  it('allows anything when the allowlist is empty', () => {
    expect(isOriginAllowed([], 'https://evil.example')).toBe(true)
  })

  it('allows anything when allowed_origins is null (column unset)', () => {
    expect(isOriginAllowed(null, 'https://evil.example')).toBe(true)
  })

  it('allows anything when allowed_origins is undefined', () => {
    expect(isOriginAllowed(undefined, 'https://evil.example')).toBe(true)
  })

  it('treats a wildcard entry as opting out of the check', () => {
    expect(isOriginAllowed(['*'], 'https://evil.example')).toBe(true)
    expect(isOriginAllowed(['https://acme.example', '*'], 'https://evil.example')).toBe(true)
    expect(isOriginAllowed(['*'], null)).toBe(true)
  })
})

describe('isOriginAllowed — a configured allowlist is enforced', () => {
  it('allows a listed origin from the Origin header', () => {
    expect(isOriginAllowed(ALLOW, 'https://acme.example')).toBe(true)
    expect(isOriginAllowed(ALLOW, 'https://shop.acme.example')).toBe(true)
  })

  it('refuses an unlisted origin', () => {
    expect(isOriginAllowed(ALLOW, 'https://evil.example')).toBe(false)
  })

  it('REGRESSION: omitting the origin entirely must NOT bypass the allowlist', () => {
    // The original bug: `if (allowed_origins.length && origin)` meant a caller
    // that simply sent no origin skipped the check completely.
    expect(isOriginAllowed(ALLOW, null)).toBe(false)
    expect(isOriginAllowed(ALLOW, undefined)).toBe(false)
    expect(isOriginAllowed(ALLOW, '')).toBe(false)
    expect(isOriginAllowed(ALLOW, null, undefined)).toBe(false)
    expect(isOriginAllowed(ALLOW, '', '')).toBe(false)
  })

  it('does not accept a non-string body origin', () => {
    expect(isOriginAllowed(ALLOW, null, 42)).toBe(false)
    expect(isOriginAllowed(ALLOW, null, { toString: () => 'https://acme.example' })).toBe(false)
    expect(isOriginAllowed(ALLOW, null, ['https://acme.example'])).toBe(false)
    expect(isOriginAllowed(ALLOW, null, true)).toBe(false)
  })

  it('prefers the browser-set header over a spoofable body value', () => {
    // Page JS can put anything in the JSON body but cannot forge Origin, so a
    // hostile body must not launder an unlisted header origin into an allow.
    expect(isOriginAllowed(ALLOW, 'https://evil.example', 'https://acme.example')).toBe(false)
  })

  it('falls back to the body origin only when the header is absent', () => {
    expect(isOriginAllowed(ALLOW, null, 'https://acme.example')).toBe(true)
    expect(isOriginAllowed(ALLOW, null, 'https://evil.example')).toBe(false)
  })

  it('matches origins exactly — no prefix or suffix games', () => {
    expect(isOriginAllowed(ALLOW, 'https://acme.example.evil.test')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'https://evil.test/https://acme.example')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'https://acme.example/')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'http://acme.example')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'https://acme.example:443')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'https://ACME.example')).toBe(false)
    expect(isOriginAllowed(ALLOW, 'null')).toBe(false)
  })
})

describe('isSessionExpired', () => {
  const now = Date.parse('2026-08-20T12:00:00.000Z')

  it('treats a future expiry as live', () => {
    expect(isSessionExpired('2026-08-20T12:00:01.000Z', now)).toBe(false)
    expect(isSessionExpired('2027-01-01T00:00:00.000Z', now)).toBe(false)
  })

  it('REGRESSION: a past expiry is refused', () => {
    // The original bug: expires_at was written but never checked, so a stolen
    // session token stayed valid forever.
    expect(isSessionExpired('2026-08-20T11:59:59.000Z', now)).toBe(true)
    expect(isSessionExpired('2020-01-01T00:00:00.000Z', now)).toBe(true)
  })

  it('treats the exact expiry instant as expired (<=, not <)', () => {
    expect(isSessionExpired('2026-08-20T12:00:00.000Z', now)).toBe(true)
  })

  it('treats an unset expiry as live (column is nullable)', () => {
    expect(isSessionExpired(null, now)).toBe(false)
    expect(isSessionExpired(undefined, now)).toBe(false)
    expect(isSessionExpired('', now)).toBe(false)
  })

  it('fails CLOSED on an unparseable timestamp', () => {
    expect(isSessionExpired('not-a-date', now)).toBe(true)
    expect(isSessionExpired('2026-13-45T99:99:99Z', now)).toBe(true)
  })

  it('accepts Date and epoch-millis inputs', () => {
    expect(isSessionExpired(new Date(now + 1000), now)).toBe(false)
    expect(isSessionExpired(new Date(now - 1000), now)).toBe(true)
    expect(isSessionExpired(now + 1000, now)).toBe(false)
    expect(isSessionExpired(now - 1000, now)).toBe(true)
  })

  it('defaults to the current wall clock when now is omitted', () => {
    expect(isSessionExpired(new Date(Date.now() + 60_000))).toBe(false)
    expect(isSessionExpired(new Date(Date.now() - 60_000))).toBe(true)
  })
})
