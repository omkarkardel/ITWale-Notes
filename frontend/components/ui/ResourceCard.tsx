import React from 'react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'

type Resource = { id: string; title: string; type: string; price: number }

export default function ResourceCard({ r, onBuy }: { r: Resource; onBuy?: (id: string) => void }) {
  const typeTone: Record<string, any> = {
    HANDWRITTEN: 'green',
    QUESTION_BANK: 'amber',
    BOOK: 'gray',
    DECODE: 'blue',
    PAPER: 'gray',
    SOLUTION: 'blue',
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.title}
            <Badge tone={typeTone[r.type] || 'gray'}>{r.type}</Badge>
          </div>
          <div className="text-xs text-gray-600 mt-1">Price: {r.price === 0 ? <span className="text-green-700 font-medium">Free</span> : <>₹{(r.price/100).toFixed(2)}</>}</div>
        </div>
        {onBuy && <Button onClick={() => onBuy(r.id)}>Buy</Button>}
      </div>
    </Card>
  )
}
