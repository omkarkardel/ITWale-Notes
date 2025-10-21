import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: Request) {
  const bodyText = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const expected = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(bodyText) as any
  // Handle payment.captured or order.paid
  const event = payload.event as string
  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload.payload?.payment?.entity || payload.payload?.order?.entity
    const orderId: string | undefined = payment?.order_id || payment?.id
    const paymentId: string | undefined = payment?.id
    const signatureProv: string | undefined = signature
    if (orderId) {
      const order = await prisma.order.findFirst({ where: { providerOrderId: orderId } })
      if (order && order.status !== 'PAID') {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', paidAt: new Date(), providerPaymentId: paymentId, providerSignature: signatureProv } })
        const items = await prisma.orderItem.findMany({ where: { orderId: order.id }, include: { resource: { select: { title: true } } } })
        for (const it of items) {
          await prisma.purchase.upsert({
            where: { userId_resourceId: { userId: order.userId, resourceId: it.resourceId } },
            create: { userId: order.userId, resourceId: it.resourceId },
            update: {},
          })
        }
        // Send emails (best-effort)
        ;(async () => {
          try {
            const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } })
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
            const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
            if (adminEmail) {
              await sendMail({
                to: adminEmail,
                subject: `New purchase - Order ${order.id.slice(0,8)}`,
                text: `Order ${order.id} paid (₹${amountRupees}). Buyer: ${buyerTo || 'unknown'}. Items: ${titles.join(', ')}`,
              })
            }
          } catch (e) {
            console.error('email:purchase webhook error', e)
          }
        })()
      }
    }
  }

  return NextResponse.json({ received: true })
}
