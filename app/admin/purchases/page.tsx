'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

export default function AdminPurchasesPage() {
  const [list, setList] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/auth/me')
      const m = await me.json()
      if (!m.user || m.user.role !== 'admin') { window.location.href = '/auth/login'; return }
      const res = await fetch('/api/admin/purchases')
      if (res.ok) setList(await res.json())
    })()
  }, [])

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">Admin - User Purches</h2>
      <ul className="space-y-2">
        {list.map((p: any) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.resource?.title}</div>
                <div className="text-xs text-gray-600">
                  {p.resource?.unit?.subject?.name} • {p.resource?.unit?.subject?.year} Sem {p.resource?.unit?.subject?.semester} • Unit {p.resource?.unit?.unitNumber} • {p.resource?.unit?.examType}
                </div>
                <div className="text-xs text-gray-600">Buyer: {p.user?.name || '—'} ({p.user?.email})</div>
              </div>
              <div className="text-right text-xs text-gray-700">
                <div>₹{((p.amountPaise || p.resource?.price || 0)/100).toFixed(2)}</div>
                <div className="text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        ))}
      </ul>
    </main>
  )
}
