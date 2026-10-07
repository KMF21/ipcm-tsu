export type FeeType = 'application' | 'acceptance' | 'tuition'

/** What get_receipt() returns: everything printed on a receipt. */
export type Receipt = {
  id: string
  receipt_no: string
  verify_token: string
  reference: string
  paid_at: string
  method: 'paystack' | 'manual' | 'sponsor'
  channel: string
  base_amount_kobo: number
  processing_fee_kobo: number
  amount_kobo: number
  fee_type: FeeType
  programme_code: string
  programme_title: string
  cohort_name: string | null
  application_ref: string | null
  reg_no: string | null
  payer_name: string
  payer_email: string
  payer_phone: string | null
}

/** What verify_receipt() returns to anyone who scans the QR code. */
export type ReceiptCheck = {
  valid: boolean
  status: string
  receipt_no: string
  paid_at: string | null
  amount_kobo: number
  fee_type: FeeType
  programme_code: string
  programme_title: string
  cohort_name: string | null
  payer_name: string
}

export const FEE_LABEL: Record<FeeType, string> = {
  application: 'Application fee',
  acceptance: 'Acceptance fee',
  tuition: 'Tuition',
}

export function paymentMethodLabel(method: Receipt['method'], channel: string) {
  if (method === 'manual') return 'Bank payment (recorded by Bursary)'
  if (method === 'sponsor') return 'Paid by sponsor'
  const c: Record<string, string> = { card: 'Card', bank: 'Bank', bank_transfer: 'Bank transfer', ussd: 'USSD', qr: 'QR', mobile_money: 'Mobile money' }
  return `Paystack${c[channel] ? ` · ${c[channel]}` : ''}`
}

/** "7 October 2026, 4:12 pm" in Nigerian time, whatever the server's time zone. */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Exact amount with kobo, e.g. ₦15,300.00 */
export function formatNairaExact(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const verifyPath = (token: string) => `/verify/receipt/${token}`
