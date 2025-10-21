import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const payload = getUserFromRequest<{ sub: string; email: string; role: string }>(req)
  if (!payload) return NextResponse.json({ user: null })
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true } })
  return NextResponse.json({ user })
}
export const dynamic = 'force-dynamic'