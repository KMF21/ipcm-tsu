import { NextResponse, after, type NextRequest } from 'next/server'
import { verifyTransaction } from '@/lib/payments/paystack'
import { recordTransaction } from '@/lib/payments/confirm'
import { notifyPaymentConfirmed } from '@/lib/email/notify'
import { emailBaseUrl } from '@/lib/email/base'

/** Paystack sends the payer back here. We verify with Paystack server-to-server before trusting anything. */
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const reference = request.nextUrl.searchParams.get('reference') ?? request.nextUrl.searchParams.get('trxref')
  if (!reference) return NextResponse.redirect(`${origin}/portal/apply/pay?failed=1`)

  try {
    const tx = await verifyTransaction(reference)
    const outcome = await recordTransaction(tx)
    // Email the receipt (and admission letter) once, from whichever of callback/webhook confirmed first.
    if (outcome.kind === 'paid' && outcome.fresh) {
      const baseUrl = emailBaseUrl(request.nextUrl.origin)
      after(() => notifyPaymentConfirmed({ baseUrl }, tx.reference))
    }
    if (outcome.kind === 'paid') {
      return NextResponse.redirect(
        outcome.feeType === 'tuition' ? `${origin}/portal/apply?admitted=1` : `${origin}/portal/apply?step=2&paid=1`,
      )
    }
    if (outcome.kind === 'pending') return NextResponse.redirect(`${origin}/portal/apply/pay?pending=${encodeURIComponent(reference)}`)
    return NextResponse.redirect(`${origin}/portal/apply/pay?failed=1`)
  } catch (e) {
    // Network hiccup: the webhook will still confirm the payment; ask the applicant to wait.
    console.error('[payments] callback verify failed', reference, (e as Error).message)
    return NextResponse.redirect(`${origin}/portal/apply/pay?pending=${encodeURIComponent(reference)}`)
  }
}
