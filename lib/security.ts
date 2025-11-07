function isDevOrigin(urlStr: string): boolean {
  try {
    const u = new URL(urlStr)
    const host = u.hostname
    const isLocalhost = host === 'localhost' || host === '127.0.0.1'
    const isPrivate10 = host.startsWith('10.')
    const isPrivate192 = host.startsWith('192.168.')
    const isPrivate172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    return ['http:', 'https:'].includes(u.protocol) && (isLocalhost || isPrivate10 || isPrivate192 || isPrivate172)
  } catch { return false }
}

export function isSameOrigin(req: Request) {
  try {
    const url = new URL(req.url)
    const origin = url.origin
    const reqOrigin = req.headers.get('origin') || ''
    const referer = req.headers.get('referer') || ''
    if (!reqOrigin && !referer) return true

    // In development, allow typical local/LAN origins to reduce friction
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
      if ((reqOrigin && isDevOrigin(reqOrigin)) || (referer && isDevOrigin(referer))) return true
    }

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