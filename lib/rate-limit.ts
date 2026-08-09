// Simple in-memory rate limiter — fine for a single-instance hackathon
// demo. NOTE: this resets on every serverless cold start and does NOT
// share state across multiple Vercel function instances, so it's a soft
// deterrent against casual abuse, not a hard guarantee. A real deployment
// would use Upstash Redis or similar for a shared, persistent counter.

const requestLog = new Map<string, number[]>();

export function rateLimit(identifier: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (requestLog.get(identifier) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    requestLog.set(identifier, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  requestLog.set(identifier, timestamps);

  return { allowed: true, remaining: maxRequests - timestamps.length };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}