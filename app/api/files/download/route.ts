import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/cookies'
import { promises as fs } from 'fs'
import path from 'path'
import { s3Enabled, getSignedGetUrl } from '@/lib/s3'
import { isSameOrigin, rateLimit } from '@/lib/security'

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'local'
  if (!rateLimit(`download:${ip}`, 60, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const user = getUserFromRequest<{ sub: string }>(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resourceId } = await req.json() as { resourceId: string }
  let purchase = await prisma.purchase.findUnique({ where: { userId_resourceId: { userId: user.sub, resourceId } }, include: { resource: true } })
  // If not purchased yet, but resource is free and has a file, auto-grant
  if (!purchase) {
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (resource && (resource.price || 0) === 0 && resource.filePath) {
      purchase = await prisma.purchase.create({ data: { userId: user.sub, resourceId }, include: { resource: true } as any }) as any
    }
  }
  if (!purchase || !purchase.resource?.filePath) return NextResponse.json({ error: 'No access' }, { status: 403 })

  const p = purchase.resource.filePath
  const originalName = purchase.resource.title
  if (s3Enabled() && p.startsWith('s3://')) {
    const [, , bucketAndKey] = p.split('/') // ['s3:', '', 'bucket/key']
    const key = bucketAndKey.substring(bucketAndKey.indexOf('/') + 1)
    // Use stored object basename (it includes the original filename suffix with extension)
    const suggested = path.basename(key)
    const url = await getSignedGetUrl(key, 60, suggested)
    // 302 redirect to signed URL for download
    return NextResponse.redirect(url)
  }

  const buf = await fs.readFile(p)
  // Prefer original filename if it had an extension; else fallback to the stored file basename
  const storedName = path.basename(p)
  const fileName = storedName // storedName contains the original name suffix from upload
  // Try to guess content-type from extension for local files (simple mapping)
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  const mime = ext === 'pdf' ? 'application/pdf'
    : ext === 'txt' ? 'text/plain'
    : ext === 'doc' ? 'application/msword'
    : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : ext === 'ppt' ? 'application/vnd.ms-powerpoint'
    : ext === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    : ext === 'png' ? 'image/png'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : 'application/octet-stream'
  return new NextResponse(new Blob([new Uint8Array(buf)]), { status: 200, headers: {
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="${fileName}"`
  } })
}
