'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/auth/me')
      const m = await me.json()
      if (!m.user || m.user.role !== 'admin') { window.location.href = '/auth/login'; return }
      const res = await fetch('/api/admin/orders')
      if (res.ok) setOrders(await res.json())
    })()
  }, [])

  async function markPaid(id: string) {
    const res = await fetch('/api/orders/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: id }) })
    if (res.ok) setOrders(orders.map(o => o.id === id ? { ...o, status: 'PAID' } : o))
  }

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Admin - Orders</h2>
  <Link href="/admin/purchases" className="text-blue-600 hover:underline">View User Purches →</Link>
      </div>
      <ul className="space-y-2">
        {orders.map((o: any) => (
          <Card key={o.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Order {o.id.slice(0,8)} • ₹{(o.amountPaise/100).toFixed(2)} • {o.status}</div>
                <div className="text-xs text-gray-600">Gateway: {o.gateway} {o.providerOrderId ? `• ${o.providerOrderId}` : ''} {o.providerPaymentId ? `• ${o.providerPaymentId}` : ''}</div>
                {o.upiIntent && <div className="text-xs text-gray-600 truncate">UPI: {o.upiIntent}</div>}
              </div>
              {o.status !== 'PAID' && <Button variant="secondary" onClick={() => markPaid(o.id)}>Mark paid</Button>}
            </div>
          </Card>
        ))}
      </ul>
    </main>
  )
}
