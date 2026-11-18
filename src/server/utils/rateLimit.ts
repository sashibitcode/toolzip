interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Default: max 30 conversion requests per 5 minutes per IP
const MAX_REQUESTS = 30;
const WINDOW_MS = 5 * 60 * 1000;

export function checkRateLimit(ip: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { timestamps: [] };

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);
  rateLimitMap.set(ip, record);

  // Periodic pruning of idle entries to prevent memory leaks
  if (rateLimitMap.size > 5000) {
    rateLimitMap.forEach((value, key) => {
      if (value.timestamps.length === 0 || now - value.timestamps[value.timestamps.length - 1] > windowMs) {
        rateLimitMap.delete(key);
      }
    });
  }

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}
