import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { sendMail } from '@/lib/email'
import { isSameOrigin, rateLimit } from '@/lib/security'

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`mark-paid:${ip}`, 30, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const user = getUserFromRequest<{ sub: string, role: string }>(req)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await req.json() as { orderId: string }
  const order = await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID', paidAt: new Date() }, include: { items: true } })
  // grant purchases
  for (const it of order.items) {
    await prisma.purchase.upsert({
      where: { userId_resourceId: { userId: order.userId, resourceId: it.resourceId } },
      create: { userId: order.userId, resourceId: it.resourceId },
      update: {},
    })
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } })
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id }, include: { resource: { select: { title: true } } } })
    const titles = items.map(i => i.resource?.title).filter(Boolean)
    const amountRupees = (order.amountPaise / 100).toFixed(2)
    const brand = process.env.MERCHANT_NAME || 'ITWale Notes'
    const buyerTo = user?.email
    if (buyerTo) {
      await sendMail({
        to: buyerTo,
        subject: `Payment successful - ${brand}`,
        text: `Thank you for your purchase of ${titles.join(', ')}. Amount: ₹${amountRupees}. You now have lifetime access. View here: ${process.env.NEXT_PUBLIC_BASE_URL || ''}/purchases`,
      })
    }
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `Order paid: ${order.id.slice(0,8)}`,
        text: `Order ${order.id} has been marked as PAID (₹${amountRupees}). Items: ${titles.join(', ')}`,
      })
    }
  } catch (e) {
    console.error('Email notify failed', e)
  }
  return NextResponse.json({ ok: true })
}
