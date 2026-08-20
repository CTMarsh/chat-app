import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { allowRequest, getClientIp } from '../ip-rate-limit'
import { RateLimiter } from '../rate-limiter'

/**
 * getClientIp only reads request.headers, so a plain Web Request is a faithful
 * stand-in for NextRequest here and keeps the suite free of the Next runtime.
 */
function req(headers: Record<string, string>): NextRequest {
  return new Request('https://chat.noahsark.me/api/widget/message', {
    headers,
  }) as unknown as NextRequest
}

// Each test uses its own bucket name because the module keeps process-global
// state — that is the production behaviour, not a test artefact.
let seq = 0
const uniq = (p: string) => `${p}-${++seq}-${Math.random().toString(36).slice(2)}`

describe('getClientIp', () => {
  it('uses the leftmost x-forwarded-for entry', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('takes the leftmost of a proxy chain and trims whitespace', () => {
    expect(
      getClientIp(req({ 'x-forwarded-for': ' 203.0.113.9 , 10.0.80.210 , 10.42.0.1 ' }))
    ).toBe('203.0.113.9')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(getClientIp(req({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7')
  })

  it('falls back to x-real-ip when x-forwarded-for is empty', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '', 'x-real-ip': '198.51.100.7' }))).toBe(
      '198.51.100.7'
    )
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    expect(
      getClientIp(req({ 'x-forwarded-for': '203.0.113.9', 'x-real-ip': '198.51.100.7' }))
    ).toBe('203.0.113.9')
  })

  it('returns "unknown" when neither header is present', () => {
    expect(getClientIp(req({}))).toBe('unknown')
  })

  it('groups every header-less caller into one shared "unknown" bucket', () => {
    // Documented consequence: if the proxy ever stops setting XFF, all traffic
    // shares a single limiter. Traefik sets it, so this is the failure mode to
    // watch, not a bug in this function.
    const bucket = uniq('unknown-collapse')
    expect(allowRequest(bucket, getClientIp(req({})), 2, 60)).toBe(true)
    expect(allowRequest(bucket, getClientIp(req({})), 2, 60)).toBe(true)
    expect(allowRequest(bucket, getClientIp(req({})), 2, 60)).toBe(false)
  })

  it('KNOWN WEAKNESS: the leftmost XFF value is attacker-controlled', () => {
    // Traefik appends the real peer and does NOT strip a client-supplied XFF,
    // so a caller can rotate this header to get a fresh bucket every request.
    // Pinned deliberately: changing to a right-most-minus-N-hops read is a
    // behaviour change that must be a conscious edit, not an accident.
    const a = getClientIp(req({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }))
    const b = getClientIp(req({ 'x-forwarded-for': '2.2.2.2, 203.0.113.9' }))
    expect(a).toBe('1.1.1.1')
    expect(b).toBe('2.2.2.2')
    expect(a).not.toBe(b)
  })
})

describe('allowRequest — burst budget', () => {
  it('allows exactly maxTokens requests then refuses', () => {
    const bucket = uniq('burst')
    for (let i = 0; i < 5; i++) {
      expect(allowRequest(bucket, '203.0.113.1', 5, 60), `request ${i + 1}`).toBe(true)
    }
    expect(allowRequest(bucket, '203.0.113.1', 5, 60)).toBe(false)
    expect(allowRequest(bucket, '203.0.113.1', 5, 60)).toBe(false)
  })

  it('matches the widget-message budget of 30 writes', () => {
    const bucket = uniq('widget-message')
    for (let i = 0; i < 30; i++) {
      expect(allowRequest(bucket, '203.0.113.2', 30, 2)).toBe(true)
    }
    expect(allowRequest(bucket, '203.0.113.2', 30, 2)).toBe(false)
  })

  it('matches the widget-session budget of 10 writes', () => {
    const bucket = uniq('widget-session')
    for (let i = 0; i < 10; i++) {
      expect(allowRequest(bucket, '203.0.113.3', 10, 6)).toBe(true)
    }
    expect(allowRequest(bucket, '203.0.113.3', 10, 6)).toBe(false)
  })

  it('refuses immediately when maxTokens is 0', () => {
    expect(allowRequest(uniq('zero'), '203.0.113.4', 0, 60)).toBe(false)
  })
})

describe('allowRequest — isolation', () => {
  it('gives each IP its own budget', () => {
    const bucket = uniq('per-ip')
    expect(allowRequest(bucket, '203.0.113.10', 1, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.10', 1, 60)).toBe(false)
    // A different IP must be unaffected by the first one's exhaustion.
    expect(allowRequest(bucket, '203.0.113.11', 1, 60)).toBe(true)
  })

  it('gives each endpoint bucket its own budget for the same IP', () => {
    const a = uniq('endpoint-a')
    const b = uniq('endpoint-b')
    expect(allowRequest(a, '203.0.113.20', 1, 60)).toBe(true)
    expect(allowRequest(a, '203.0.113.20', 1, 60)).toBe(false)
    // Exhausting /widget/message must not lock the same caller out of
    // /widget/session — namespacing is the whole point of the bucket key.
    expect(allowRequest(b, '203.0.113.20', 1, 60)).toBe(true)
  })

  it('keeps a limiter across calls rather than recreating it per request', () => {
    const bucket = uniq('persist')
    expect(allowRequest(bucket, '203.0.113.30', 2, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.30', 2, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.30', 2, 60)).toBe(false)
  })

  it('ignores maxTokens changes after the limiter for an IP exists', () => {
    // The first call fixes the budget; a later call passing a larger maxTokens
    // does NOT re-arm the bucket. Pinned so a caller cannot widen its own limit
    // mid-flight and so a future refactor notices this.
    const bucket = uniq('sticky')
    expect(allowRequest(bucket, '203.0.113.40', 1, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.40', 1000, 60)).toBe(false)
  })
})

describe('allowRequest — refill over time', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not refill before a full interval has elapsed', () => {
    const bucket = uniq('refill-early')
    expect(allowRequest(bucket, '203.0.113.50', 1, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.50', 1, 60)).toBe(false)
    vi.advanceTimersByTime(59_000)
    expect(allowRequest(bucket, '203.0.113.50', 1, 60)).toBe(false)
  })

  it('refills one token per refill interval', () => {
    const bucket = uniq('refill')
    expect(allowRequest(bucket, '203.0.113.51', 1, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.51', 1, 60)).toBe(false)
    vi.advanceTimersByTime(60_000)
    expect(allowRequest(bucket, '203.0.113.51', 1, 60)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.51', 1, 60)).toBe(false)
  })

  it('never refills beyond the burst ceiling', () => {
    const bucket = uniq('ceiling')
    for (let i = 0; i < 3; i++) expect(allowRequest(bucket, '203.0.113.52', 3, 10)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.52', 3, 10)).toBe(false)
    // Idle for far longer than 3 intervals — the bucket must cap at 3, not 100.
    vi.advanceTimersByTime(1_000_000)
    for (let i = 0; i < 3; i++) expect(allowRequest(bucket, '203.0.113.52', 3, 10)).toBe(true)
    expect(allowRequest(bucket, '203.0.113.52', 3, 10)).toBe(false)
  })
})

describe('RateLimiter — the token bucket underneath', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts full', () => {
    const l = new RateLimiter(3, 1)
    expect([l.tryConsume(), l.tryConsume(), l.tryConsume(), l.tryConsume()]).toEqual([
      true,
      true,
      true,
      false,
    ])
  })

  it('refills proportionally to elapsed intervals', () => {
    const l = new RateLimiter(5, 2)
    for (let i = 0; i < 5; i++) expect(l.tryConsume()).toBe(true)
    expect(l.tryConsume()).toBe(false)
    vi.advanceTimersByTime(6_000) // 3 intervals of 2s
    expect([l.tryConsume(), l.tryConsume(), l.tryConsume(), l.tryConsume()]).toEqual([
      true,
      true,
      true,
      false,
    ])
  })

  it('a zero-capacity limiter always refuses', () => {
    const l = new RateLimiter(0, 1)
    expect(l.tryConsume()).toBe(false)
    vi.advanceTimersByTime(60_000)
    expect(l.tryConsume()).toBe(false)
  })

  it('time not moving means no free tokens', () => {
    const l = new RateLimiter(2, 5)
    expect(l.tryConsume()).toBe(true)
    expect(l.tryConsume()).toBe(true)
    for (let i = 0; i < 100; i++) expect(l.tryConsume()).toBe(false)
  })
})
