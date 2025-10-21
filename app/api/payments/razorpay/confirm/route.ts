import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { verifyJwt } from '@/lib/auth/jwt'
import { sendMail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('cookie') || ''
    const token = auth.split('token=')[1]?.split(';')[0]
    const user = token ? verifyJwt<{ sub: string }>(token) : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null) as null | {
      orderId: string
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })

    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.sub } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'PAID') return NextResponse.json({ ok: true, status: 'PAID' })
    if (order.providerOrderId && order.providerOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
    }

    // Verify signature: HMAC_SHA256(order_id + '|' + payment_id)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Mark paid and grant purchases
    const updated = await prisma.order.update({ where: { id: order.id }, data: {
      status: 'PAID',
      paidAt: new Date(),
      gateway: 'RAZORPAY',
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature,
    } })

    const items = await prisma.orderItem.findMany({ where: { orderId: updated.id }, include: { resource: { select: { title: true } } } })
    for (const it of items) {
      await prisma.purchase.upsert({
        where: { userId_resourceId: { userId: updated.userId, resourceId: it.resourceId } },
        create: { userId: updated.userId, resourceId: it.resourceId },
        update: {},
      })
    }

    // Send confirmation emails (best-effort, do not block response)
    ;(async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: updated.userId }, select: { email: true, name: true } })
        const titles = items.map(i => i.resource?.title).filter(Boolean)
        const amountRupees = (updated.amountPaise / 100).toFixed(2)
        const brand = process.env.MERCHANT_NAME || 'ITWale Notes'
        const buyerTo = user?.email
        if (buyerTo) {
          await sendMail({
            to: buyerTo,
            subject: `Payment successful - ${brand}`,
            text: `Thank you for your purchase of ${titles.join(', ')}. Amount: ₹${amountRupees}. You now have lifetime access. View here: ${process.env.NEXT_PUBLIC_BASE_URL || ''}/purchases`,
            html: `<p>Thank you for your purchase!</p>
                   <p><strong>Items:</strong> ${titles.map(t => `<div>${t}</div>`).join('')}</p>
                   <p><strong>Amount:</strong> ₹${amountRupees}</p>
                   <p>You now have lifetime access. <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/purchases">View your purchases</a></p>`
          })
        }
        const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
        if (adminEmail) {
          await sendMail({
            to: adminEmail,
            subject: `New purchase - Order ${updated.id.slice(0,8)}`,
            text: `Order ${updated.id} paid (₹${amountRupees}). Buyer: ${buyerTo || 'unknown'}. Items: ${titles.join(', ')}`,
          })
        }
      } catch (e) {
        console.error('email:purchase confirm error', e)
      }
    })()

    return NextResponse.json({ ok: true, status: 'PAID' })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', detail: e?.message || '' }, { status: 500 })
  }
}
