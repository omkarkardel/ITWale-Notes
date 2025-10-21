import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth/jwt'

export async function GET(req: Request) {
  const auth = req.headers.get('cookie') || ''
  const token = auth.split('token=')[1]?.split(';')[0]
  const user = token ? verifyJwt<{ sub: string }>(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.purchase.findMany({ where: { userId: user.sub }, include: { resource: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}
