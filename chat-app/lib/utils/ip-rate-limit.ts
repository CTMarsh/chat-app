import type { NextRequest } from 'next/server'
import { RateLimiter } from './rate-limiter'

/**
 * Shared per-IP token-bucket rate limiting for public endpoints, backed by the
 * same RateLimiter used by /api/widget/config. Buckets are namespaced so each
 * endpoint gets its own limit budget.
 */

const buckets = new Map<string, Map<string, RateLimiter>>()

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

/**
 * Returns true if the request is allowed, false if it should be rate-limited.
 * @param bucket   endpoint namespace (e.g. 'widget-message')
 * @param ip       client IP from getClientIp()
 * @param maxTokens burst capacity
 * @param refillSeconds seconds per refilled token
 */
export function allowRequest(
  bucket: string,
  ip: string,
  maxTokens: number,
  refillSeconds: number
): boolean {
  let map = buckets.get(bucket)
  if (!map) {
    map = new Map()
    buckets.set(bucket, map)
  }

  let limiter = map.get(ip)
  if (!limiter) {
    limiter = new RateLimiter(maxTokens, refillSeconds)
    map.set(ip, limiter)
    // Bound memory: evict the oldest entry once the bucket grows large.
    if (map.size > 10000) {
      const firstKey = map.keys().next().value
      if (firstKey) map.delete(firstKey)
    }
  }
  return limiter.tryConsume()
}
