import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    error: 'PhonePe gateway has been replaced with direct manual payment. Please use /api/orders/create.',
  }, { status: 410 })
}
