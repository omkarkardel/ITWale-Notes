export function isSameOrigin(req: Request) {
  try {
    const url = new URL(req.url)
    const origin = url.origin
    const reqOrigin = req.headers.get('origin') || ''
    const referer = req.headers.get('referer') || ''
    if (!reqOrigin && !referer) return true

    // Allow additional trusted origins from env (comma-separated)
    const extra = (process.env.ALLOWED_CSRF_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const isAllowedExtra = extra.some(allowed => {
      try {
        return (!!reqOrigin && reqOrigin === allowed) || (!!referer && referer.startsWith(allowed))
      } catch { return false }
    })

    return (!!reqOrigin && reqOrigin === origin) || (!!referer && referer.startsWith(origin)) || isAllowedExtra
  } catch {
    return false
  }
}

// Very light in-memory rate limiter (per process)
const buckets = new Map<string, { count: number; ts: number }>()
export function rateLimit(key: string, max = 20, windowMs = 60_000) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.ts > windowMs) {
    buckets.set(key, { count: 1, ts: now })
    return true
  }
  b.count += 1
  if (b.count > max) return false
  return true
}