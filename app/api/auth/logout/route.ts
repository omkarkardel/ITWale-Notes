import { NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST() {
  const cookie = serialize('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' } })
}
