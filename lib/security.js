/**
 * Verify the cron request is from Vercel or a trusted caller.
 * Checks three possible locations for the secret:
 *  1. Authorization: Bearer <CRON_SECRET>  (Vercel sets this automatically)
 *  2. ?secret=<CRON_SECRET>  (manual trigger via URL)
 *  3. x-cron-secret: <CRON_SECRET>  (custom header)
 */
export function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[security] CRON_SECRET not set — allowing request (dev mode)');
    return true;
  }

  // 1. Authorization Bearer
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader === `Bearer ${secret}`) return true;

  // 2. Query param
  const url = new URL(request.url);
  if (url.searchParams.get('secret') === secret) return true;

  // 3. Custom header
  if (request.headers.get('x-cron-secret') === secret) return true;

  return false;
}

/**
 * Verify the site API password (for admin routes like fix-excerpts).
 */
export function verifySitePassword(request) {
  const password = process.env.SITE_API_PASSWORD;
  if (!password) return true; // Not set = open in dev

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader === `Bearer ${password}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get('password') === password) return true;

  return false;
}

/**
 * Simple in-memory rate limiter (per-endpoint, resets on cold start).
 * For production, use Upstash Redis or similar.
 */
const rateLimitStore = new Map();

export function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetAt: record.resetAt,
  };
}
