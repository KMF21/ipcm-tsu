'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from './paystack'
import { siteUrl } from '@/lib/site-url'

export type PayState = { message?: string }

/** Creates the payment record (amount from the database) and sends the applicant to Paystack. */
export async function startPayment(_: PayState, fd: FormData): Promise<PayState> {
  const feeType = fd.get('fee_type') === 'tuition' ? 'tuition' : 'application'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply/pay')

  const { data, error } = await supabase.rpc('create_payment', { p_fee_type: feeType })
  if (error || !data) {
    const m = error?.message ?? ''
    if (m.includes('already paid')) redirect('/portal/apply?step=2')
    if (m.includes('not due') || m.includes('No application')) redirect('/portal/apply')
    if (m.includes('expired')) return { message: 'Your offer has expired. Please contact the admissions office.' }
    return { message: 'We couldn’t start the payment. Please try again.' }
  }
  const p = data as { reference: string; amount_kobo: number; email: string; application_id: string }

  let url: string
  try {
    const init = await initializeTransaction({
      email: p.email || user.email!,
      amountKobo: p.amount_kobo,
      reference: p.reference,
      callbackUrl: `${await siteUrl()}/api/paystack/callback`,
      metadata: { application_id: p.application_id, fee_type: feeType, user_id: user.id, cancel_action: `${await siteUrl()}/portal/apply/pay?cancelled=1` },
    })
    url = init.authorization_url
  } catch (e) {
    console.error('[payments] initialize failed', (e as Error).message)
    return { message: 'The payment service is not responding. Please try again in a moment.' }
  }
  redirect(url)
}
