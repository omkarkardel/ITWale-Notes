'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PhonePeInstructions from '@/components/PhonePeInstructions'
import { purchaseResources, type PhonePeInfo } from '@/lib/purchase'

export default function UnitPage({ params }: { params: { subjectId: string; unitNo: string } }) {
  const { subjectId, unitNo } = params
  const [items, setItems] = useState<any[]>([])
  const [phonePeInfo, setPhonePeInfo] = useState<PhonePeInfo | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
  const res = await fetch('/api/resources/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId, units: [Number(unitNo)], hasFile: true }) })
      if (res.ok) setItems(await res.json())
    })()
  }, [subjectId, unitNo])

  async function buy(resourceId: string) {
    const result = await purchaseResources([resourceId])
    if (result.type === 'unauthorized') {
      alert('Please login to continue')
      window.location.href = '/auth/login'
      return
    }
    if (result.type === 'error') {
      alert(result.message)
      return
    }
    if (result.type === 'free') {
      window.location.href = '/purchases'
      return
    }
    if (result.type === 'phonepe') {
      setPhonePeInfo(result.info)
      setSuccessMessage('Payment required: complete the PhonePe payment using the details below to get access.')
    }
  }

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">Unit {unitNo} Resources</h2>
      {successMessage && phonePeInfo ? (
        <div className="mb-4 space-y-3">
          <Card className="border-green-500 bg-green-50 text-green-800">
            {successMessage} We have also emailed these instructions to you.
          </Card>
          <PhonePeInstructions
            info={phonePeInfo}
            onClose={() => {
              setPhonePeInfo(null)
              setSuccessMessage(null)
            }}
          />
        </div>
      ) : null}
      <ul className="space-y-2">
        {items
          .filter((r) => r.type === 'HANDWRITTEN' || r.type === 'QUESTION_BANK')
          .sort((a,b) => (a.type === 'HANDWRITTEN' ? -1 : 1))
          .map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.type === 'HANDWRITTEN' ? 'Handwritten Notes' : 'IMP Questions'}</div>
                <div className="text-xs text-gray-600">{r.title}</div>
              </div>
              {r.price === 0 ? (
                <Button onClick={() => buy(r.id)}>Get Free</Button>
              ) : (
                <Button onClick={() => buy(r.id)}>Buy ₹{(r.price/100).toFixed(2)}</Button>
              )}
            </div>
          </Card>
        ))}
      </ul>
    </main>
  )
}
