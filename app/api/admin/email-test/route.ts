import { NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/auth/jwt'
import { sendMail } from '@/lib/email'

export async function POST(req: Request) {
  const auth = req.headers.get('cookie') || ''
  const token = auth.split('token=')[1]?.split(';')[0]
  const user = token ? verifyJwt<{ sub: string, role: string }>(token) : null
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL
  if (!to) return NextResponse.json({ error: 'Set ADMIN_NOTIFY_EMAIL or ADMIN_EMAIL in .env' }, { status: 400 })

  const info = await sendMail({ to, subject: 'Test email from ITWale Notes', text: 'This is a test email to verify SMTP settings.' })
  return NextResponse.json({ ok: true, info })
}
