import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const year = url.searchParams.get('year') || undefined
    const semStr = url.searchParams.get('sem')
    const sem = semStr ? Number(semStr) : undefined
    const q = url.searchParams.get('q')?.trim()

    const where: any = {}
    if (year) where.year = year
    if (sem) where.semester = sem
    // For small datasets the in-memory filter is fine; adjust to DB-side text index if needed later.
    if (!q) {
      const subjects = await prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } })
      return NextResponse.json(subjects)
    } else {
      const subjects = await prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } })
      const ql = q.toLowerCase()
      const filtered = subjects.filter(s => s.name.toLowerCase().includes(ql))
      return NextResponse.json(filtered)
    }
  } catch (e) {
    console.error('Subjects fetch failed:', e)
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
  }
}
