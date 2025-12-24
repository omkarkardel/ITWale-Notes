import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth/jwt'
import { serialize } from 'cookie'
import { isSameOrigin, rateLimit } from '@/lib/security'
import { buildCorsHeaders, optionsResponse } from '@/lib/cors'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function OPTIONS(req: Request) { return optionsResponse(req) }

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`login:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  let data: unknown
  try { data = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  let user: { id: string; email: string; password: string; role: string } | null = null
  try {
    user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  } catch (e) {
    // Log the underlying DB error for troubleshooting (kept generic in response)
    console.error('Login DB lookup failed:', e)
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = bcrypt.compareSync(parsed.data.password, user.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = signJwt({ sub: user.id, email: user.email, role: user.role })
  const reqOrigin = req.headers.get('origin') || ''
  const url = new URL(req.url)
  const crossSite = !!reqOrigin && reqOrigin !== url.origin
  const cookie = serialize('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: (crossSite ? 'none' : 'lax') as any,
    secure: process.env.NODE_ENV === 'production' || crossSite,
  })
  // Email notifications removed per request

  const cors = buildCorsHeaders(req)
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json', ...cors },
  })
}
