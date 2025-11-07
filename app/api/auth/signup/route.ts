import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { isSameOrigin, rateLimit } from '@/lib/security'
import { buildCorsHeaders, optionsResponse } from '@/lib/cors'

const schema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() })

export async function OPTIONS(req: Request) { return optionsResponse(req) }

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`signup:${ip}`, 5, 60_000)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  let data: unknown
  try { data = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  try {
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hash = bcrypt.hashSync(parsed.data.password, 10)
    await prisma.user.create({ data: { email: parsed.data.email, password: hash, name: parsed.data.name } })
  } catch (e) {
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
  }
  const cors = buildCorsHeaders(req)
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } })
}
