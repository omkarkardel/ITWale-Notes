import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { isSameOrigin } from '@/lib/security'
export const dynamic = 'force-dynamic'

function requireAdmin(req: Request) {
  const user = getUserFromRequest<{ sub: string; role: string }>(req)
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(req: Request) {
  const user = requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const subjectId = url.searchParams.get('subjectId') || undefined
  const where: any = {}
  if (subjectId) where.unit = { subjectId }
  const list = await prisma.resource.findMany({ where, include: { unit: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(list)
}

export async function PATCH(req: Request) {
  const user = requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const body = await req.json() as { id: string; title?: string; price?: number; type?: string }
  const data: any = {}
  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.price === 'number') data.price = body.price
  if (typeof body.type === 'string') data.type = body.type
  const updated = await prisma.resource.update({ where: { id: body.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const user = requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.orderItem.deleteMany({ where: { resourceId: id } })
  await prisma.purchase.deleteMany({ where: { resourceId: id } })
  await prisma.resource.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  // Resolve or create a resource given subjectId + (unitNumber or examType) + type
  const user = requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const body = await req.json() as {
    subjectId: string
    unitNumber?: number
    examType?: 'INSEM' | 'ENDSEM'
    type: 'HANDWRITTEN' | 'QUESTION_BANK' | 'BOOK' | 'DECODE' | 'PAPER' | 'SOLUTION'
  }
  const { subjectId, unitNumber, examType, type } = body
  if (!subjectId || !type) return NextResponse.json({ error: 'subjectId and type required' }, { status: 400 })
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
  if (!subject) return NextResponse.json({ error: 'Invalid subjectId' }, { status: 404 })
  const subjectName = subject.name

  // Find or create the unit
  let unit: any = null
  if (typeof unitNumber === 'number') {
    unit = await prisma.unit.findFirst({ where: { subjectId, unitNumber } })
    if (!unit) {
      const derivedExam = unitNumber <= 2 ? 'INSEM' : 'ENDSEM'
      unit = await prisma.unit.create({ data: { subjectId, unitNumber, examType: derivedExam } })
    }
  } else if (examType) {
    unit = await prisma.unit.findFirst({ where: { subjectId, examType }, orderBy: { unitNumber: 'asc' } })
    if (!unit) {
      // Create a default unit for given examType
      const defaultUnitNumber = examType === 'INSEM' ? 1 : 3
      unit = await prisma.unit.create({ data: { subjectId, unitNumber: defaultUnitNumber, examType } })
    }
  } else {
    return NextResponse.json({ error: 'Either unitNumber or examType is required' }, { status: 400 })
  }

  // Canonical title generator
  function canonicalTitle() {
    if (type === 'HANDWRITTEN') return `${subjectName} - Unit ${unit.unitNumber} Handwritten Notes`
    if (type === 'QUESTION_BANK') return `${subjectName} - Unit ${unit.unitNumber} IMP Questions`
    if (type === 'PAPER') return `${subjectName} ${unit.examType} PYQ Papers`
    if (type === 'SOLUTION') return `${subjectName} ${unit.examType} PYQ Solutions`
    return `${subjectName} - Unit ${unit.unitNumber} ${type}`
  }

  // Find or create the resource on that unit
  let resource = await prisma.resource.findFirst({ where: { unitId: unit.id, type } })
  const desiredTitle = canonicalTitle()
  if (!resource) {
    // Default prices similar to seed
    let price = 0
    if (type === 'HANDWRITTEN') price = 4999
    else if (type === 'QUESTION_BANK') price = 2999
    else if (type === 'PAPER') price = 2999
    else if (type === 'SOLUTION') price = 3999
    resource = await prisma.resource.create({ data: { unitId: unit.id, type, title: desiredTitle, price } })
  } else if (resource.title !== desiredTitle) {
    // Normalize title if it drifted (e.g., wrong subject name)
    resource = await prisma.resource.update({ where: { id: resource.id }, data: { title: desiredTitle } })
  }
  return NextResponse.json({ id: resource.id, unit, resource })
}
