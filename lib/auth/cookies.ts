import { verifyJwt } from '@/lib/auth/jwt'
import cookie from 'cookie'

export function getTokenFromRequest(req: Request): string | null {
  const raw = req.headers.get('cookie') || ''
  if (!raw) return null
  try {
    const parsed = cookie.parse(raw)
    return parsed['token'] || null
  } catch {
    // Fallback: naive split
    return raw.split('token=')[1]?.split(';')[0] || null
  }
}

export function getUserFromRequest<T = any>(req: Request): T | null {
  const token = getTokenFromRequest(req)
  return token ? verifyJwt<T>(token) : null
}