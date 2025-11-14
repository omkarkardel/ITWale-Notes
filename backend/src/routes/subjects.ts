import { Router, Request, Response } from 'express'
import { prisma } from '@itwale/database'

export const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const year = (req.query.year as string) || undefined
  const semStr = req.query.sem as string | undefined
  const sem = semStr ? Number(semStr) : undefined
  const q = (req.query.q as string | undefined)?.trim()

  const where: any = {}
  if (year) where.year = year
  if (sem) where.semester = sem
  if (!q) {
    const subjects = await prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } })
    return res.json(subjects)
  } else {
    const subjects = await prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } })
    const ql = q.toLowerCase()
  const filtered = subjects.filter((s: any) => s.name.toLowerCase().includes(ql))
    return res.json(filtered)
  }
})
