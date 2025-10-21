'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PhonePeInstructions from '@/components/PhonePeInstructions'
import type { PhonePeInfo } from '@/lib/purchase'

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [status, setStatus] = useState<'PENDING'|'PAID'|'CANCELLED'|'UNKNOWN'>('UNKNOWN')
  const [amount, setAmount] = useState<number>(0)
  const [gateway, setGateway] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [phonePeInfo, setPhonePeInfo] = useState<PhonePeInfo | null>(null)

  useEffect(() => {
    let timer: any
    async function poll() {
      const res = await fetch(`/api/orders/status?orderId=${id}`)
      if (res.ok) {
        const data = await res.json()
    setStatus(data.status)
    setAmount(data.amountPaise)
    setGateway(data.gateway)
    setIsAdmin(!!data.isAdmin)
    setPhonePeInfo(data.phonepe ?? null)
        if (data.status !== 'PAID') timer = setTimeout(poll, 3000)
      } else {
        timer = setTimeout(poll, 3000)
      }
    }
    poll()
    return () => timer && clearTimeout(timer)
  }, [id])

  return (
    <main className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Order Status</h2>
      <Card>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Order:</span>
            <span className="font-mono break-all">{id}</span>
            <Button onClick={async () => { try { await navigator.clipboard.writeText(id); setCopied(true); setTimeout(()=>setCopied(false), 1500) } catch {} }}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div>Gateway: {gateway || '—'}</div>
          <div>Status: <span className="font-semibold">{status}</span></div>
          <div>Amount: ₹{(amount/100).toFixed(2)}</div>
          {phonePeInfo ? (
            <div className="space-y-3">
              <Card className="border-green-500 bg-green-50 text-green-800">
                Access to your notes is active. Please finish the PhonePe payment using the instructions below (also emailed to you).
              </Card>
              <PhonePeInstructions info={phonePeInfo} />
            </div>
          ) : null}
          {status === 'PAID' ? (
            <Button onClick={() => (window.location.href = '/purchases')}>Go to Purchases</Button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Waiting for payment confirmation... this page auto-refreshes.</div>
              <div className="text-sm text-gray-600">If you already transferred the amount via PhonePe, this page will update to PAID shortly.</div>
              {isAdmin && (
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium mb-2">Admin actions</div>
                  <Button onClick={async () => {
                    const res = await fetch('/api/orders/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: id }) })
                    if (res.ok) {
                      setStatus('PAID')
                    }
                  }}>Mark Paid</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </main>
  )
}
