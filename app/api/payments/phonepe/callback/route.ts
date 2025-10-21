import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('orderId')
  return NextResponse.redirect(orderId ? `/orders/${orderId}` : '/orders')
}

export async function POST(req: Request) {
  return GET(req)
}
