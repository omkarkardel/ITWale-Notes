import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth/jwt'
import { promises as fs } from 'fs'
import path from 'path'
import { s3Enabled, putToS3 } from '@/lib/s3'
import { isSameOrigin, rateLimit } from '@/lib/security'

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`upload:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const auth = req.headers.get('cookie') || ''
  const token = auth.split('token=')[1]?.split(';')[0]
  const user = token ? verifyJwt<{ sub: string, role: string }>(token) : null
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const resourceIdRaw = form.get('resourceId')
  const resourceId = typeof resourceIdRaw === 'string' ? resourceIdRaw : ''
  if (!file || !resourceId) return NextResponse.json({ error: 'Missing fields: file and resourceId are required' }, { status: 400 })

  // Ensure resource exists
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
  if (!resource) return NextResponse.json({ error: 'Invalid resourceId' }, { status: 404 })

  // Basic size check (e.g., 50 MB)
  const size = (file as any).size as number | undefined
  if (typeof size === 'number' && size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 })
  }

  const original = (file as any).name as string | undefined
  const safeName = (original || 'upload')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
  const stamped = `${resourceId}-${Date.now()}-${safeName}`
  const arrayBuffer = await file.arrayBuffer()

  // Basic MIME/extension allowlist (pdf, images)
  const contentType = (file as any).type as string | undefined
  const allowed = ['application/pdf', 'image/png', 'image/jpeg']
  const ext = (original || '').toLowerCase().split('.').pop() || ''
  const allowedExt = ['pdf', 'png', 'jpg', 'jpeg']
  if (!(contentType && allowed.includes(contentType)) && !(allowedExt.includes(ext))) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  let storedPath = ''
  if (s3Enabled()) {
    try {
      const prefix = process.env.S3_PREFIX || 'uploads'
      const key = `${prefix}/${stamped}`
  const res = await putToS3(key, Buffer.from(arrayBuffer), contentType)
      storedPath = `s3://${res.bucket}/${res.key}`
    } catch (e) {
      console.error('S3 upload failed, falling back to local storage', e)
    }
  }
  if (!storedPath) {
    const uploadsDir = path.join(process.cwd(), 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, stamped)
    await fs.writeFile(filePath, Buffer.from(arrayBuffer))
    storedPath = filePath
  }

  await prisma.resource.update({ where: { id: resourceId }, data: { filePath: storedPath } })
  return NextResponse.json({ ok: true, filePath: storedPath })
}
