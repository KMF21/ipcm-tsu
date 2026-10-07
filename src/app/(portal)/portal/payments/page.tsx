import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Download, Receipt as ReceiptIcon } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { getMyPayments } from '@/lib/receipts/queries'
import { FEE_LABEL, formatDateTime } from '@/lib/receipts/types'
import { formatNaira } from '@/lib/utils'

export const metadata = { title: 'Payments' }

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/payments')
  const payments = await getMyPayments(supabase, user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">Payments</h1>
      <p className="mt-2 text-base text-ink-muted">Every successful payment has a receipt. Download it, print it, or show the QR code to anyone who needs to check it.</p>

      {payments.length === 0 ? (
        <div className="mt-8">
          <EmptyState illustration title="No payments yet" body="When you pay a fee, your receipt will appear here." action={<ButtonLink href="/portal/apply">Go to my application</ButtonLink>} />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {payments.map((p) => (
            <li key={p.id} className="rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <Link href={`/portal/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal"><ReceiptIcon className="h-6 w-6" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-navy">
                      {p.fee_items ? FEE_LABEL[p.fee_items.type] : 'Payment'}{p.fee_items?.programmes ? ` · ${p.fee_items.programmes.code}` : ''}
                    </span>
                    <span className="block text-sm text-ink-muted">{p.receipt_no} · {p.paid_at ? formatDateTime(p.paid_at) : ''}</span>
                  </span>
                  <span className="whitespace-nowrap font-display text-lg font-bold text-navy">{formatNaira(p.amount_kobo)}</span>
                  <ChevronRight className="hidden h-5 w-5 text-ink-muted sm:block" aria-hidden />
                </Link>
                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <ButtonLink href={`/portal/payments/${p.id}`} variant="secondary">View receipt</ButtonLink>
                  <a href={`/portal/payments/${p.id}/pdf`} download className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-teal px-5 py-2.5 text-base font-semibold text-white hover:bg-teal-700"><Download className="h-5 w-5" aria-hidden /> PDF</a>
                </div>
                <a href={`/portal/payments/${p.id}/pdf`} download className="hidden min-h-[44px] items-center gap-2 rounded-full px-4 text-base font-semibold text-teal hover:bg-teal-50 sm:inline-flex" aria-label={`Download receipt ${p.receipt_no} as PDF`}><Download className="h-5 w-5" aria-hidden /> PDF</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
