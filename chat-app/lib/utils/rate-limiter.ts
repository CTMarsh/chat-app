/**
 * Token-bucket rate limiter. Ported from Swift RateLimiter.
 *
 * Usage:
 *   const limiter = new RateLimiter(10, 1.0) // 10 burst, 1 token per second
 *   if (!limiter.tryConsume()) { // rate limited }
 */
export class RateLimiter {
  private readonly maxTokens: number
  private readonly refillIntervalMs: number
  private tokens: number
  private lastRefill: number

  constructor(maxTokens: number, refillIntervalSeconds: number) {
    this.maxTokens = maxTokens
    this.refillIntervalMs = refillIntervalSeconds * 1000
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  tryConsume(): boolean {
    this.refill()
    if (this.tokens <= 0) return false
    this.tokens -= 1
    return true
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const newTokens = Math.floor(elapsed / this.refillIntervalMs)
    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens)
      this.lastRefill = now
    }
  }
}
