'use client'
import { useEffect, useState } from 'react'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => { (async () => {
    const res = await fetch('/api/my-orders')
    if (res.ok) setOrders(await res.json())
  })() }, [])

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="p-3 border rounded bg-white">
            <div className="font-medium">Order {o.id.slice(0,8)} • ₹{(o.amountPaise/100).toFixed(2)} • {o.status}</div>
            {o.status !== 'PAID' && o.upiIntent ? (
              <a className="text-sm underline" href={o.upiIntent}>
                Open PhonePe payment link
              </a>
            ) : (
              <a className="text-sm underline" href={`/orders/${o.id}`}>
                View PhonePe instructions
              </a>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
