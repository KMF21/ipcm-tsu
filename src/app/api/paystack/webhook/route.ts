import { NextResponse, type NextRequest } from 'next/server'
import { isValidSignature, verifyTransaction } from '@/lib/payments/paystack'
import { recordTransaction } from '@/lib/payments/confirm'

/**
 * Paystack webhook. Set in Paystack → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/paystack/webhook
 * Confirms payments even if the applicant closes the browser before returning.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!isValidSignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (event.event !== 'charge.success' || !event.data?.reference) return NextResponse.json({ ok: true })

  try {
    // Re-verify with Paystack rather than trusting the webhook body alone.
    const tx = await verifyTransaction(event.data.reference)
    const outcome = await recordTransaction(tx)
    if (outcome.kind === 'failed' && outcome.reason === 'error') return NextResponse.json({ ok: false }, { status: 500 }) // Paystack retries
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[payments] webhook processing failed', event.data.reference, (e as Error).message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
