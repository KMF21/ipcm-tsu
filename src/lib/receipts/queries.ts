import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Receipt, ReceiptCheck } from './types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The signed-in payer's receipt (or any receipt, for Bursary). Null if not theirs or not paid. */
export async function getReceipt(supabase: SupabaseClient, paymentId: string): Promise<Receipt | null> {
  if (!UUID.test(paymentId)) return null
  const { data, error } = await supabase.rpc('get_receipt', { p_payment: paymentId })
  if (error) console.error('[receipts] get_receipt', error.message)
  return (data as Receipt | null) ?? null
}

/** Public QR check. Null when the token matches no receipt. */
export async function checkReceipt(supabase: SupabaseClient, token: string): Promise<ReceiptCheck | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null
  const { data, error } = await supabase.rpc('verify_receipt', { p_token: token })
  if (error) console.error('[receipts] verify_receipt', error.message)
  return (data as ReceiptCheck | null) ?? null
}

export type PaymentRow = {
  id: string
  receipt_no: string | null
  status: string
  amount_kobo: number
  paid_at: string | null
  created_at: string
  fee_items: { type: Receipt['fee_type']; programmes: { code: string } | null } | null
}

/** The payer's completed payments, newest first. */
export async function getMyPayments(supabase: SupabaseClient, userId: string): Promise<PaymentRow[]> {
  const { data } = await supabase
    .from('payments')
    .select('id, receipt_no, status, amount_kobo, paid_at, created_at, fee_items(type, programmes(code))')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
  return (data as unknown as PaymentRow[]) ?? []
}
