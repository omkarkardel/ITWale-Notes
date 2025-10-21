import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = getUserFromRequest<{ sub: string, role: string }>(req)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(orders)
}
