import { NextResponse } from 'next/server'
import { serialize } from 'cookie'
import { buildCorsHeaders, optionsResponse } from '@/lib/cors'

export async function OPTIONS(req: Request) { return optionsResponse(req) }

export async function POST(req: Request) {
  const reqOrigin = req.headers.get('origin') || ''
  const url = new URL(req.url)
  const crossSite = !!reqOrigin && reqOrigin !== url.origin
  const cookie = serialize('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: (crossSite ? 'none' : 'lax') as any,
    secure: process.env.NODE_ENV === 'production' || crossSite,
  })
  const cors = buildCorsHeaders(req)
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json', ...cors } })
}
