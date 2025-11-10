export type PhonePeInfo = {
  upiId: string
  phoneNumber: string
  payeeName?: string
  upiIntentUrl: string
  amountPaise: number
}

export type PurchaseResult =
  | { type: 'unauthorized' }
  | { type: 'error'; message: string }
  | { type: 'free' }
  | { type: 'phonepe'; info: PhonePeInfo }

export async function purchaseResources(resourceIds: string[]): Promise<PurchaseResult> {
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceIds }),
  })

  let data: any = null
  try { data = await res.json() } catch {}

  if (res.status === 401) { return { type: 'unauthorized' } }
  if (!res.ok) { return { type: 'error', message: data?.error || 'Failed to create order' } }
  if (data?.free && data?.status === 'PAID') { return { type: 'free' } }
  if ((data?.status === 'PENDING' || data?.status === 'PAID') && data?.phonepe) {
    const info = data.phonepe as PhonePeInfo
    return { type: 'phonepe', info }
  }
  return { type: 'error', message: 'Unexpected order response' }
}
