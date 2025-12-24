import { Router, Request, Response } from 'express'
import { getDb } from '../lib/mongodb'

export const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const year = (req.query.year as string) || undefined
  const semStr = req.query.sem as string | undefined
  const sem = semStr ? Number(semStr) : undefined
  const q = (req.query.q as string | undefined)?.trim()

  const db = await getDb()
  const collection = db.collection('Subject')

  const where: any = {}
  if (year) where.year = year
  if (sem) where.semester = sem
  
  const subjects = await collection.find(where, {
    projection: { _id: 1, name: 1, year: 1, semester: 1 }
  }).sort({ name: 1 }).toArray()

  // Rename _id to id for frontend compatibility
  const subjectsWithId = subjects.map(s => ({ ...s, id: s._id.toHexString() }))

  if (!q) {
    return res.json(subjectsWithId)
  } else {
    const ql = q.toLowerCase()
    const filtered = subjectsWithId.filter((s: any) => s.name.toLowerCase().includes(ql))
    return res.json(filtered)
  }
})
