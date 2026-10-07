import { describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'

vi.mock('server-only', () => ({}))
const { buildReceiptPdf } = await import('../receipts/pdf')
const { formatDateTime, formatNairaExact, paymentMethodLabel, verifyPath } = await import('../receipts/types')
type Receipt = import('../receipts/types').Receipt

const sample: Receipt = {
  id: '00000000-0000-0000-0000-000000000001',
  receipt_no: 'RCT-2026-000001',
  verify_token: '0123456789abcdef0123456789abcdef',
  reference: 'IPCM-APP-0123456789abcdef0123456789abcdef',
  paid_at: '2026-10-07T15:12:00Z',
  method: 'paystack',
  channel: 'card',
  base_amount_kobo: 1500000,
  processing_fee_kobo: 30000,
  amount_kobo: 1530000,
  fee_type: 'application',
  programme_code: 'PCM',
  programme_title: 'Certificate in Peace and Conflict Management',
  cohort_name: 'February 2027 cohort',
  application_ref: 'APP-26-ABC123',
  reg_no: null,
  payer_name: 'Amina Bello',
  payer_email: 'amina@example.com',
  payer_phone: null,
}

describe('receipt formatting', () => {
  it('shows exact naira with kobo', () => {
    expect(formatNairaExact(1530000)).toBe('₦15,300.00')
  })
  it('uses Nigerian time regardless of server time zone', () => {
    expect(formatDateTime('2026-10-07T15:12:00Z')).toMatch(/7 October 2026.*4:12\s?pm/i)
  })
  it('labels payment methods', () => {
    expect(paymentMethodLabel('paystack', 'bank_transfer')).toBe('Paystack · Bank transfer')
    expect(paymentMethodLabel('manual', '')).toMatch(/Bursary/)
  })
  it('verify links use the secret token, never the receipt number', () => {
    expect(verifyPath(sample.verify_token)).toBe('/verify/receipt/0123456789abcdef0123456789abcdef')
  })
})

describe('receipt PDF', () => {
  it('builds a one-page A4 PDF with the receipt number in the title', async () => {
    const bytes = await buildReceiptPdf(sample, 'https://example.com/verify/receipt/' + sample.verify_token)
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
    const { width, height } = doc.getPage(0).getSize()
    expect(Math.round(width)).toBe(595)
    expect(Math.round(height)).toBe(842)
    expect(doc.getTitle()).toBe('Receipt RCT-2026-000001')
    expect(bytes.length).toBeLessThan(400_000)
  })
})
