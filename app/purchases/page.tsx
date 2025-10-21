'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function PurchasesPage() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/purchases')
      if (res.ok) setItems(await res.json())
    })()
  }, [])

  async function download(resourceId: string) {
    const res = await fetch('/api/files/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resourceId }), redirect: 'follow' as any })
    if (res.redirected) {
      window.location.href = res.url
      return
    }
  if (!res.ok) return alert('No access')
  const disp = res.headers.get('Content-Disposition') || ''
  const m = /filename="?([^";]+)"?/i.exec(disp)
  const suggested = m?.[1] || 'file'
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggested
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">My Purchases</h2>
      <ul className="space-y-2">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.resource.title}</div>
                <div className="text-xs text-gray-600">Type: {p.resource.type}</div>
              </div>
              <Button variant="secondary" onClick={() => download(p.resourceId)}>Download</Button>
            </div>
          </Card>
        ))}
      </ul>
    </main>
  )
}
