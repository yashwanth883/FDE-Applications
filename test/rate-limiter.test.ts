import { describe, it, expect, vi } from 'vitest';
import { RateLimiter } from '../src/client/rate-limiter.js';

describe('RateLimiter', () => {
  it('should initialize token bucket with specified burst capacity', () => {
    const limiter = new RateLimiter({
      rps: 5,
      burst: 10,
      maxRetries: 3,
      retryBaseDelayMs: 100,
    });

    const stats = limiter.getStats();
    expect(stats.maxBurst).toBe(10);
    expect(stats.rps).toBe(5);
    expect(stats.availableTokens).toBe(10);
  });

  it('should consume tokens on acquire', async () => {
    const limiter = new RateLimiter({
      rps: 10,
      burst: 5,
      maxRetries: 2,
      retryBaseDelayMs: 50,
    });

    await limiter.acquireToken();
    const stats = limiter.getStats();
    expect(stats.availableTokens).toBeLessThan(5);
  });

  it('should calculate exponential backoff with jitter', () => {
    const limiter = new RateLimiter({
      rps: 5,
      burst: 5,
      maxRetries: 3,
      retryBaseDelayMs: 200,
    });

    // Attempt 1: 200 * 2^1 = 400 + jitter (0-200) -> range [400, 600]
    const delay1 = limiter.calculateBackoffDelay(1);
    expect(delay1).toBeGreaterThanOrEqual(400);
    expect(delay1).toBeLessThanOrEqual(600);

    // Respects Retry-After header if provided in seconds
    const retryAfterSeconds = limiter.calculateBackoffDelay(1, '3');
    expect(retryAfterSeconds).toBe(3000);
  });

  it('should retry on HTTP 429 and succeed upon recovery', async () => {
    const limiter = new RateLimiter({
      rps: 20,
      burst: 10,
      maxRetries: 3,
      retryBaseDelayMs: 20,
    });

    let attempts = 0;
    const mockOperation = async () => {
      attempts++;
      if (attempts < 3) {
        const err: any = new Error('Too Many Requests');
        err.status = 429;
        throw err;
      }
      return 'success_payload';
    };

    const retryLog: number[] = [];
    const result = await limiter.executeWithRetry(mockOperation, (attempt) => {
      retryLog.push(attempt);
    });

    expect(result).toBe('success_payload');
    expect(attempts).toBe(3);
    expect(retryLog).toEqual([1, 2]);
  });

  it('should throw if maximum retries are exhausted', async () => {
    const limiter = new RateLimiter({
      rps: 50,
      burst: 10,
      maxRetries: 2,
      retryBaseDelayMs: 10,
    });

    const alwaysFails = async () => {
      const err: any = new Error('Persistent 429 rate limit');
      err.status = 429;
      throw err;
    };

    await expect(limiter.executeWithRetry(alwaysFails)).rejects.toThrow('Persistent 429 rate limit');
  });
});
