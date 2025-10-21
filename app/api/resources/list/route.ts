import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Body = {
  subjectId: string
  units?: number[]
  type?: string
  examType?: 'INSEM' | 'ENDSEM'
  hasFile?: boolean
}

export async function POST(req: Request) {
  let body: Partial<Body> = {}
  try {
    body = await req.json()
  } catch {}
  const { subjectId, units, type, examType, hasFile } = body as Body
  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 })
  const unitsWhere = units ? { unitNumber: { in: units } } : {}
  const where: any = { unit: { subjectId, ...unitsWhere } }
  if (type) where.type = type
  if (examType) where.unit.examType = examType
  if (hasFile) where.filePath = { not: null }
  const list = await prisma.resource.findMany({
    where,
    include: { unit: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(list)
}
