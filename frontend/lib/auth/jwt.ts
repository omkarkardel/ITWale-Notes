import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret') {
  throw new Error('JWT_SECRET must be set in production')
}
const JWT_EXPIRES_IN_DAYS = Number(process.env.JWT_EXPIRES_IN_DAYS || 7)

export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` })
}

export function verifyJwt<T = any>(token: string): T | null {
  try { return jwt.verify(token, JWT_SECRET) as T } catch { return null }
}
