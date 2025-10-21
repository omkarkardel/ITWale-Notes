import { NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = req.headers.get('cookie') || ''
  const token = auth.split('token=')[1]?.split(';')[0]
  const user = token ? verifyJwt<{ sub: string }>(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orders = await prisma.order.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(orders)
}
