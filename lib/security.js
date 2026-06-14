// lib/security.js — Auth helpers for CricketLiveNews

/** Verify cron secret — 3 methods */
export function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  if (request.headers.get('authorization') === `Bearer ${secret}`) return true
  if (new URL(request.url).searchParams.get('secret') === secret) return true
  if (request.headers.get('x-cron-secret') === secret) return true
  return false
}

/** Verify site API password (for fix-excerpts, indexnow) */
export function verifySitePassword(request) {
  const password = process.env.SITE_API_PASSWORD || process.env.CRON_SECRET
  if (!password) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${password}`) return true
  if (new URL(request.url).searchParams.get('secret') === password) return true
  return false
}

/** Simple in-memory rate limiter */
const rateLimitStore = new Map()
export function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now()
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count++
  rateLimitStore.set(key, entry)
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

export function apiResponse(data, status = 200) {
  return Response.json(data, { status })
}
