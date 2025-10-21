import { Router, Request, Response } from 'express'
import { prisma } from '@itwale/database'

export const router = Router()

type Body = {
  subjectId: string
  units?: number[]
  type?: string
  examType?: 'INSEM' | 'ENDSEM'
  hasFile?: boolean
}

router.post('/list', async (req: Request, res: Response) => {
  const { subjectId, units, type, examType, hasFile } = req.body as Partial<Body>
  if (!subjectId) return res.status(400).json({ error: 'subjectId required' })
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
  return res.json(list)
})
