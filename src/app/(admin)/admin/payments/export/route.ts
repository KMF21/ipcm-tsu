import type { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/admin/session'
import { can } from '@/lib/admin/roles'
import { csvResponse, toCsv } from '@/lib/admin/csv'
import { FEE_LABEL, formatDateTime } from '@/lib/receipts/types'

export async function GET(req: NextRequest) {
  const { supabase } = await requireStaff(can.money)
  const sp = req.nextUrl.searchParams
  const status = sp.get('status')
  const type = sp.get('type')
  let q = supabase
    .from('payments')
    .select('receipt_no, reference, status, method, amount_kobo, base_amount_kobo, processing_fee_kobo, paid_at, created_at, note, paystack_payload, fee_items!inner(type, programmes(code)), profiles!payments_user_id_fkey(first_name, surname, email), applications(ref)')
    .order('created_at', { ascending: false })
    .limit(10000)
  if (status !== 'all') q = q.eq('status', status === 'pending' || status === 'failed' ? status : 'paid')
  if (type === 'application' || type === 'tuition') q = q.eq('fee_items.type', type)
  const { data } = await q
  type Row = { receipt_no: string | null; reference: string; status: string; method: string; amount_kobo: number; base_amount_kobo: number; processing_fee_kobo: number; paid_at: string | null; created_at: string; note: string | null; paystack_payload: Record<string, unknown> | null; fee_items: { type: keyof typeof FEE_LABEL; programmes: { code: string } | null } | null; profiles: { first_name: string | null; surname: string | null; email: string } | null; applications: { ref: string } | null }
  const naira = (k: number) => (k / 100).toFixed(2)
  const rows = ((data ?? []) as unknown as Row[]).map((p) => [
    p.receipt_no, p.reference, p.status, p.fee_items ? FEE_LABEL[p.fee_items.type] : '', p.fee_items?.programmes?.code,
    [p.profiles?.first_name, p.profiles?.surname].filter(Boolean).join(' '), p.profiles?.email, p.applications?.ref,
    naira(p.base_amount_kobo), naira(p.processing_fee_kobo), naira(p.amount_kobo),
    p.method === 'paystack' ? `Paystack ${String(p.paystack_payload?.channel ?? '')}`.trim() : p.method === 'sponsor' ? 'Sponsor' : 'Bank',
    String(p.paystack_payload?.bank_reference ?? ''), p.paid_at ? formatDateTime(p.paid_at) : '', formatDateTime(p.created_at), p.note,
  ])
  return csvResponse('ipcm-payments', toCsv(
    ['Receipt', 'Reference', 'Status', 'Fee', 'Programme', 'Payer', 'Email', 'Application', 'Amount (NGN)', 'Processing (NGN)', 'Total (NGN)', 'Method', 'Bank reference', 'Paid at', 'Started at', 'Note'],
    rows,
  ))
}
