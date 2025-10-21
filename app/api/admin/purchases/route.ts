import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = getUserFromRequest<{ sub: string, role: string }>(req)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, name: true } },
      resource: {
        select: {
          id: true,
          title: true,
          price: true,
          unit: { select: { unitNumber: true, examType: true, subject: { select: { name: true, year: true, semester: true } } } },
        }
      }
    }
  })

  // Compute paid amount per (userId, resourceId) using OrderItem from PAID orders
  const userIds = Array.from(new Set(purchases.map(p => p.userId)))
  const resourceIds = Array.from(new Set(purchases.map(p => p.resourceId)))

  const items = await prisma.orderItem.findMany({
    where: {
      resourceId: { in: resourceIds },
      order: { userId: { in: userIds }, status: 'PAID' }
    },
    include: { order: { select: { userId: true, paidAt: true } } }
  })

  // Prefer the most recent paid order's item for the amount
  items.sort((a, b) => {
    const at = a.order.paidAt ? new Date(a.order.paidAt).getTime() : 0
    const bt = b.order.paidAt ? new Date(b.order.paidAt).getTime() : 0
    return bt - at
  })
  const amtMap = new Map<string, number>()
  for (const it of items) {
    const key = `${it.order.userId}|${it.resourceId}`
    if (!amtMap.has(key)) amtMap.set(key, it.pricePaise)
  }

  const enriched = purchases.map(p => ({
    ...p,
    amountPaise: amtMap.get(`${p.userId}|${p.resourceId}`) ?? 0,
  }))

  return NextResponse.json(enriched)
}
