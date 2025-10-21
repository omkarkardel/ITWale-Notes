import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth/jwt'
import { serialize } from 'cookie'
import { sendMail } from '@/lib/email'
import { isSameOrigin, rateLimit } from '@/lib/security'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`login:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const data = await req.json()
  const parsed = schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = bcrypt.compareSync(parsed.data.password, user.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = signJwt({ sub: user.id, email: user.email, role: user.role })
  const cookie = serialize('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  // Best-effort login notification (non-blocking)
  ;(async () => {
    try {
      await sendMail({
        to: user.email,
        subject: 'Login notification',
        text: `You have successfully logged in to ${process.env.MERCHANT_NAME || 'ITWale Notes'}. If this wasn't you, please reset your password immediately.`,
      })
    } catch {}
  })()

  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' } })
}
