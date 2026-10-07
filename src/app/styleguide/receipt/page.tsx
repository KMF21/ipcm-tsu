import { ReceiptView } from '@/components/receipts/ReceiptView'
import { VerifyResult } from '@/components/receipts/VerifyResult'
import { qrSvg } from '@/lib/receipts/qr'
import type { Receipt } from '@/lib/receipts/types'

export const metadata = { title: 'Receipt preview', robots: { index: false, follow: false } }

const sample: Receipt = {
  id: '00000000-0000-0000-0000-000000000001',
  receipt_no: 'RCT-2026-000124',
  verify_token: '3f9c1a7e5b2d4c8e9a1b2c3d4e5f6a7b',
  reference: 'IPCM-TUI-8c1f2e3d4a5b6c7d8e9f0a1b2c3d4e5f',
  paid_at: '2026-10-07T15:12:00Z',
  method: 'paystack',
  channel: 'card',
  base_amount_kobo: 3500000,
  processing_fee_kobo: 30000,
  amount_kobo: 3530000,
  fee_type: 'tuition',
  programme_code: 'PCM',
  programme_title: 'Certificate in Peace and Conflict Management',
  cohort_name: 'February 2027 cohort',
  application_ref: 'APP-26-YSG49Z',
  reg_no: 'TSU/IPCM/PCM/2027/0001',
  payer_name: 'Mrs Amina Hauwa Bello',
  payer_email: 'amina.bello@example.com',
  payer_phone: '+2348031234567',
}

/** Design preview of the receipt and the QR verification page (sample data). */
export default async function ReceiptPreview({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const v = (await searchParams).v
  const url = `https://ipcm.example/verify/receipt/${sample.verify_token}`
  if (v === 'valid') return <VerifyResult r={{ valid: true, status: 'paid', receipt_no: sample.receipt_no, paid_at: sample.paid_at, amount_kobo: sample.amount_kobo, fee_type: sample.fee_type, programme_code: sample.programme_code, programme_title: sample.programme_title, cohort_name: sample.cohort_name, payer_name: sample.payer_name }} />
  if (v === 'invalid') return <VerifyResult r={null} />
  return (
    <div className="bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl"><ReceiptView r={sample} qrSvg={await qrSvg(url)} verifyUrl={url} /></div>
    </div>
  )
}
