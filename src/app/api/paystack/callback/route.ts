import { NextResponse, type NextRequest } from 'next/server'
import { verifyTransaction } from '@/lib/payments/paystack'
import { recordTransaction } from '@/lib/payments/confirm'

/** Paystack sends the payer back here. We verify with Paystack server-to-server before trusting anything. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const reference = request.nextUrl.searchParams.get('reference') ?? request.nextUrl.searchParams.get('trxref')
  if (!reference) return NextResponse.redirect(`${origin}/portal/apply/pay?failed=1`)

  try {
    const tx = await verifyTransaction(reference)
    const outcome = await recordTransaction(tx)
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
