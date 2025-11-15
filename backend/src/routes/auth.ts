import { Router, Request, Response } from 'express'
import { prisma } from '@itwale/database'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_EXPIRES_IN_DAYS = Number(process.env.JWT_EXPIRES_IN_DAYS || 7)

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) })
const signupSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() })

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' })
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = bcrypt.compareSync(parsed.data.password, user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` })
  const sameSite = (process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')) as any
  res.cookie('token', token, {
    httpOnly: true,
    sameSite, // 'none' enables cross-site cookie usage when frontend & backend are on different domains
    secure: process.env.NODE_ENV === 'production', // required when SameSite='none'
    maxAge: JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
  res.json({ ok: true })
})

router.post('/signup', async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' })
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return res.status(409).json({ error: 'Email already in use' })
  const hash = bcrypt.hashSync(parsed.data.password, 10)
  await prisma.user.create({ data: { email: parsed.data.email, password: hash, name: parsed.data.name } })
  res.json({ ok: true })
})

router.post('/logout', (_req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, path: '/', maxAge: 0 })
  res.json({ ok: true })
})

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) return res.json({ user: null })
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true } })
    return res.json({ user })
  } catch {
    return res.json({ user: null })
  }
})

export { router }
