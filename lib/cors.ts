import { NextResponse } from 'next/server'

function getAllowedOrigins(): string[] {
  const extras = (process.env.ALLOWED_CSRF_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return extras
}

function isDevOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    const host = u.hostname
    const isLocalhost = host === 'localhost' || host === '127.0.0.1'
    const isPrivate10 = host.startsWith('10.')
    const isPrivate192 = host.startsWith('192.168.')
    const isPrivate172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    return ['http:', 'https:'].includes(u.protocol) && (isLocalhost || isPrivate10 || isPrivate192 || isPrivate172)
  } catch { return false }
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  try {
    const url = new URL(req.url)
    const origin = req.headers.get('origin') || ''
    if (!origin) return {}
    const isDev = process.env.NODE_ENV !== 'production'
    const allowed = new Set<string>([url.origin, ...getAllowedOrigins()])
    const allow = allowed.has(origin) || (isDev && isDevOrigin(origin))
    if (!allow) return {}
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    }
  } catch {
    return {}
  }
}

export function optionsResponse(req: Request) {
  const headers = buildCorsHeaders(req)
  return new NextResponse(null, { status: 204, headers })
}
