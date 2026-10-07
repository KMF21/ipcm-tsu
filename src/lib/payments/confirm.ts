import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PaystackTransaction } from './paystack'

export type ConfirmOutcome =
  | { kind: 'paid'; feeType: 'application' | 'tuition'; receiptNo: string; regNo?: string | null }
  | { kind: 'pending' }
  | { kind: 'failed'; reason: string }

/**
 * Records a verified Paystack transaction. Used by both the browser callback and the webhook;
 * whichever arrives first does the work, the database ignores the second (idempotent).
 */
export async function recordTransaction(tx: PaystackTransaction): Promise<ConfirmOutcome> {
  const admin = createAdminClient()
  if (tx.status === 'success' && tx.currency === 'NGN') {
    const { data, error } = await admin.rpc('confirm_payment', { p_reference: tx.reference, p_amount_kobo: tx.amount, p_payload: tx as unknown as Record<string, unknown> })
    if (error) {
      console.error('[payments] confirm_payment failed', tx.reference, error.message)
      return { kind: 'failed', reason: error.message.includes('Amount mismatch') ? 'amount' : 'error' }
    }
    const r = data as { fee_type: 'application' | 'tuition'; receipt_no: string; reg_no?: string | null }
    return { kind: 'paid', feeType: r.fee_type, receiptNo: r.receipt_no, regNo: r.reg_no }
  }
  if (tx.status === 'failed' || tx.status === 'abandoned' || tx.status === 'reversed') {
    await admin.rpc('mark_payment_failed', { p_reference: tx.reference, p_status: tx.status === 'abandoned' ? 'abandoned' : 'failed', p_payload: tx as unknown as Record<string, unknown> })
    return { kind: 'failed', reason: tx.gateway_response ?? tx.status }
  }
  return { kind: 'pending' }
}
