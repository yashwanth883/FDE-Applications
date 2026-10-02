export interface RateLimiterOptions {
  rps: number; // Tokens added per second
  burst: number; // Max token capacity
  maxRetries: number;
  retryBaseDelayMs: number;
}

export class RateLimiter {
  private rps: number;
  private burst: number;
  private tokens: number;
  private lastRefillTimestamp: number;
  private maxRetries: number;
  private retryBaseDelayMs: number;

  constructor(options: RateLimiterOptions) {
    this.rps = Math.max(0.1, options.rps);
    this.burst = Math.max(1, options.burst);
    this.tokens = this.burst;
    this.lastRefillTimestamp = Date.now();
    this.maxRetries = options.maxRetries;
    this.retryBaseDelayMs = options.retryBaseDelayMs;
  }

  /**
   * Proactively refills the token bucket based on elapsed time.
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.rps;
      this.tokens = Math.min(this.burst, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Acquires a token before making an outbound request.
   * If no tokens are available, pauses execution until one is generated.
   */
  public async acquireToken(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      // Calculate how long until at least 1 token is available
      const tokensNeeded = 1 - this.tokens;
      const waitMs = Math.ceil((tokensNeeded / this.rps) * 1000);
      await new Promise((resolve) => setTimeout(resolve, Math.max(10, waitMs)));
    }
  }

  /**
   * Calculates backoff delay with full jitter for handling HTTP 429 Too Many Requests.
   * Jitter prevents the "thundering herd" problem across parallel agent instances.
   */
  public calculateBackoffDelay(attempt: number, retryAfterHeader?: string | null): number {
    if (retryAfterHeader) {
      const parsedSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        return parsedSeconds * 1000;
      }
      // If it's an HTTP date string
      const parsedDate = Date.parse(retryAfterHeader);
      if (!isNaN(parsedDate) && parsedDate > Date.now()) {
        return parsedDate - Date.now();
      }
    }

    // Exponential backoff: base * 2^attempt + jitter
    const expDelay = this.retryBaseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * this.retryBaseDelayMs;
    return Math.min(30000, Math.floor(expDelay + jitter)); // Cap at 30 seconds
  }

  /**
   * Executes an asynchronous operation with proactive token bucket throttling
   * and automatic reactive exponential backoff retry on 429 / 503 errors.
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, delayMs: number, error: unknown) => void
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      // 1. Proactive rate limiting: wait for available token
      await this.acquireToken();

      try {
        return await operation();
      } catch (error: any) {
        const isRateLimited =
          error?.status === 429 ||
          error?.statusCode === 429 ||
          error?.response?.status === 429 ||
          error?.code === 'RATE_LIMIT_EXCEEDED';

        const isTemporaryServerError =
          error?.status === 503 || error?.statusCode === 503 || error?.response?.status === 503;

        if ((isRateLimited || isTemporaryServerError) && attempt < this.maxRetries) {
          attempt++;
          const retryAfter =
            error?.headers?.get?.('retry-after') ||
            error?.response?.headers?.['retry-after'] ||
            error?.retryAfter;

          const delayMs = this.calculateBackoffDelay(attempt, retryAfter);

          if (onRetry) {
            onRetry(attempt, delayMs, error);
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Exceeded retries or non-retryable error
        throw error;
      }
    }
  }

  /**
   * Exposes current bucket statistics for diagnostics / monitoring.
   */
  public getStats(): { availableTokens: number; maxBurst: number; rps: number } {
    this.refill();
    return {
      availableTokens: Math.floor(this.tokens * 100) / 100,
      maxBurst: this.burst,
      rps: this.rps,
    };
  }
}
