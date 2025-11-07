import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { prisma } from '@/lib/prisma'
import { buildCorsHeaders, optionsResponse } from '@/lib/cors'

export async function OPTIONS(req: Request) { return optionsResponse(req) }

export async function GET(req: Request) {
  const payload = getUserFromRequest<{ sub: string; email: string; role: string }>(req)
  if (!payload) return new NextResponse(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(req) } })
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true } })
  return new NextResponse(JSON.stringify({ user }), { status: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(req) } })
}
export const dynamic = 'force-dynamic'