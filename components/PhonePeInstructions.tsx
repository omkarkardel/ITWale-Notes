'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { PhonePeInfo } from '@/lib/purchase'

type Props = {
  info: PhonePeInfo
  onClose?: () => void
}

export default function PhonePeInstructions({ info, onClose }: Props) {
  const [qr, setQr] = useState<string>('')
  useEffect(() => {
    let isMounted = true
    QRCode.toDataURL(info.upiIntentUrl, { width: 240 })
      .then((url: string) => {
        if (isMounted) setQr(url)
      })
  .catch((err: unknown) => {
        console.error('Failed to build QR code', err)
      })
    return () => {
      isMounted = false
    }
  }, [info.upiIntentUrl])

  const amount = info.amountPaise ? (info.amountPaise / 100).toFixed(2) : null

  return (
    <Card className="border-blue-500 bg-blue-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-blue-700">PhonePe payment instructions</h3>
          <p className="text-sm text-blue-700/80">
            Access has been granted instantly. Please complete the PhonePe payment using any option below. These details are also emailed to you.
          </p>
          <ul className="text-sm text-blue-900 space-y-1">
            <li><strong>UPI ID:</strong> {info.upiId}</li>
            <li><strong>PhonePe mobile:</strong> {info.phoneNumber}</li>
            {info.payeeName ? (
              <li><strong>Payee name:</strong> {info.payeeName}</li>
            ) : null}
            {amount ? <li><strong>Amount:</strong> ₹{amount}</li> : null}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => window.open(info.upiIntentUrl, '_blank', 'noopener')}>Open in PhonePe</Button>
            <Button variant="secondary" onClick={() => (window.location.href = '/purchases')}>Go to my purchases</Button>
            {onClose ? (
              <Button variant="ghost" onClick={onClose}>Dismiss</Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-medium text-blue-700">Scan the QR code in PhonePe</div>
          {qr ? (
            <img src={qr} alt="PhonePe QR code" className="h-48 w-48 rounded-md border border-blue-200 bg-white p-3 shadow-sm" />
          ) : (
            <div className="h-48 w-48 animate-pulse rounded-md border border-dashed border-blue-200 bg-white/70" />
          )}
        </div>
      </div>
    </Card>
  )
}
