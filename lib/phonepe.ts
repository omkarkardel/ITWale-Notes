const FALLBACK_UPI_ID = '9309358651@ybl'
const FALLBACK_PHONE = '9309358651'

export type PhonePeConfig = {
  upiId: string
  phoneNumber: string
  payeeName: string
}

export type PhonePeInfo = PhonePeConfig & {
  upiIntentUrl: string
  amountPaise: number
}

export function getPhonePeConfig(): PhonePeConfig {
  const upiId = process.env.PHONEPE_UPI_ID || FALLBACK_UPI_ID
  const phoneNumber = process.env.PHONEPE_PHONE_NUMBER || FALLBACK_PHONE
  const payeeName = process.env.PHONEPE_PAYEE_NAME || process.env.MERCHANT_NAME || 'ITWale Notes'
  return { upiId, phoneNumber, payeeName }
}

export function buildUpiIntentUrl(amountPaise: number, config: PhonePeConfig = getPhonePeConfig()) {
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName,
    cu: 'INR',
  })
  if (amountPaise > 0) {
    params.set('am', (amountPaise / 100).toFixed(2))
  }
  return `upi://pay?${params.toString()}`
}

export function buildPhonePeInfo(amountPaise: number): PhonePeInfo {
  const config = getPhonePeConfig()
  return {
    ...config,
    upiIntentUrl: buildUpiIntentUrl(amountPaise, config),
    amountPaise,
  }
}
