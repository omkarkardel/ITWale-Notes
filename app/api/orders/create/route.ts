import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { sendMail } from '@/lib/email'
import { buildPhonePeInfo } from '@/lib/phonepe'
import { isSameOrigin, rateLimit } from '@/lib/security'

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`order-create:${ip}`, 30, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  try {
  const user = getUserFromRequest<{ sub: string }>(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: any = null
    try { body = await req.json() } catch {}
    const ids: string[] = Array.isArray(body?.resourceIds) ? body.resourceIds : []
    if (!ids.length) return NextResponse.json({ error: 'No items selected' }, { status: 400 })

    const resources = await prisma.resource.findMany({ where: { id: { in: ids } } })
    if (!resources.length) return NextResponse.json({ error: 'Resources not found' }, { status: 404 })
    const amountPaise = resources.reduce((sum: number, r: any) => sum + (r.price || 0), 0)

  // If everything selected is free (amount 0), instantly grant access without payment
  if (!amountPaise) {
    const order = await prisma.order.create({ data: {
      userId: user.sub,
      amountPaise: 0,
      gateway: 'FREE',
      status: 'PAID',
      paidAt: new Date(),
      items: { create: resources.map((r: any) => ({ resourceId: r.id, pricePaise: 0 })) },
    }})
    // Upsert purchases for all items
    for (const r of resources) {
      await prisma.purchase.upsert({
        where: { userId_resourceId: { userId: user.sub, resourceId: r.id } },
        update: {},
        create: { userId: user.sub, resourceId: r.id },
      })
    }
    return NextResponse.json({ id: order.id, status: 'PAID', free: true })
  }

  const phonePe = buildPhonePeInfo(amountPaise)

    const order = await prisma.order.create({
      data: {
        userId: user.sub,
        amountPaise,
        gateway: 'PHONEPE',
        status: 'PENDING',
        paidAt: null,
        upiIntent: phonePe.upiIntentUrl,
        items: {
          create: resources.map((r: { id: string; price: number }) => ({
            resourceId: r.id,
            pricePaise: r.price ?? 0,
          })),
        },
      },
    })

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } })

    if (dbUser?.email) {
      const resourcesList = resources.map((r) => `• ${r.title} — ₹${((r.price || 0) / 100).toFixed(2)}`).join('<br/>')
      await sendMail({
        to: dbUser.email,
        subject: 'Complete your PhonePe payment',
        html: `
          <p>Hi ${dbUser.name || 'there'},</p>
          <p>You've started a purchase for the following notes:</p>
          <p>${resourcesList}</p>
          <p>Please complete your PhonePe payment using any option below. After we verify your payment, your access will be enabled.</p>
          <ul>
            <li><strong>UPI ID:</strong> ${phonePe.upiId}</li>
            <li><strong>PhonePe number:</strong> ${phonePe.phoneNumber}</li>
            <li><strong>Payee name:</strong> ${phonePe.payeeName}</li>
          </ul>
          <p>You can tap the button below to open the payment intent in the PhonePe app:</p>
          <p><a href="${phonePe.upiIntentUrl}">Pay now with PhonePe</a></p>
          <p>If you need the QR code, open the PhonePe instructions page inside your account.</p>
          <p>Once you've paid, go to your order page and click "I've paid" to notify us.</p>
          <p>Thanks for supporting ITWale Notes!</p>
        `,
        text: `Hi ${dbUser.name || 'there'},

You've started a purchase for the following notes:
${resources.map((r) => `- ${r.title} — ₹${((r.price || 0) / 100).toFixed(2)}`).join('\n')}

Please complete your PhonePe payment using any option below. After we verify your payment, your access will be enabled.
- UPI ID: ${phonePe.upiId}
- PhonePe number: ${phonePe.phoneNumber}
- Payee name: ${phonePe.payeeName}

Open this link on your phone to pay: ${phonePe.upiIntentUrl}

Once you've paid, go to your order page and click "I've paid" to notify us.

Thanks for supporting ITWale Notes!`,
      }).catch((err) => {
        console.error('orders/create email failed', err)
      })
    }

    return NextResponse.json({
      id: order.id,
      status: 'PENDING',
      phonepe: phonePe,
    })
  } catch (e: any) {
    console.error('orders/create failed', e)
    // Try to surface a clearer message
    const msg = typeof e?.message === 'string' ? e.message : ''
    return NextResponse.json({ error: 'Internal error creating order', detail: msg }, { status: 500 })
  }
}
