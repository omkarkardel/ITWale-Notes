export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { buildPhonePeInfo } from '@/lib/phonepe'

export async function GET(req: Request) {
  const user = getUserFromRequest<{ sub: string; role?: string }>(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const orderId = url.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.sub }, include: { items: true } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user.role === 'admin'
  const phonepe = order.gateway === 'PHONEPE' ? buildPhonePeInfo(order.amountPaise) : null

  return NextResponse.json({
    id: order.id,
    status: order.status,
    amountPaise: order.amountPaise,
    gateway: order.gateway,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    upiIntent: order.upiIntent,
    phonepe,
    isAdmin,
  })
}
