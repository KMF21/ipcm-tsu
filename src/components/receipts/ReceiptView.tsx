import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { images } from '@/lib/images'
import { site } from '@/lib/site'
import { FEE_LABEL, formatDateTime, formatNairaExact, paymentMethodLabel, type Receipt } from '@/lib/receipts/types'

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-base font-semibold text-ink">{value}</dd>
    </div>
  )
}

/** On-screen (and printable) receipt. Mirrors the PDF. */
export function ReceiptView({ r, qrSvg, verifyUrl }: { r: Receipt; qrSvg: string; verifyUrl: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card print:rounded-none print:border-0 print:shadow-none" aria-label={`Receipt ${r.receipt_no}`}>
      <div className="h-2 bg-navy" />
      <div className="h-[3px] bg-teal" />
      <div className="p-5 sm:p-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src={images.logo.src} alt="Taraba State University logo" width={56} height={56} className="h-14 w-14 shrink-0" />
            <div>
              <p className="font-display text-lg font-bold leading-6 text-navy">{site.name}</p>
              <p className="text-sm text-ink-muted">{site.parent}, Jalingo</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-bold uppercase tracking-wide text-teal">Payment receipt</p>
            <p className="font-display text-xl font-bold text-navy">{r.receipt_no}</p>
            <p className="text-sm text-ink-muted">{formatDateTime(r.paid_at)}</p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-teal-50 p-5">
          <div>
            <p className="text-sm font-semibold text-ink-muted">Amount paid</p>
            <p className="font-display text-[2rem] font-bold leading-10 text-navy">{formatNairaExact(r.amount_kobo)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 sm:px-4 py-1.5 text-sm font-bold text-white">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Paid
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="border-b border-line pb-2 text-sm font-bold uppercase tracking-wide text-teal">Received from</h2>
            <dl className="mt-3 space-y-3">
              <Row label="Name" value={r.payer_name || r.payer_email} />
              <Row label="Email" value={r.payer_email} />
              <Row label="Phone" value={r.payer_phone} />
              <Row label="Application number" value={r.application_ref} />
              <Row label="Registration number" value={r.reg_no} />
            </dl>
          </section>
          <section>
            <h2 className="border-b border-line pb-2 text-sm font-bold uppercase tracking-wide text-teal">Payment details</h2>
            <dl className="mt-3 space-y-3">
              <Row label="Receipt number" value={r.receipt_no} />
              <Row label="Date and time" value={formatDateTime(r.paid_at)} />
              <Row label="Payment method" value={paymentMethodLabel(r.method, r.channel)} />
              <Row label="Transaction reference" value={r.reference} />
            </dl>
          </section>
        </div>

        <table className="mt-8 w-full text-left text-base">
          <thead>
            <tr className="bg-canvas text-sm text-navy">
              <th scope="col" className="px-3 sm:px-4 py-2.5 font-bold">Description</th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line align-top">
              <td className="px-3 sm:px-4 py-3">
                <p className="font-semibold text-ink">{FEE_LABEL[r.fee_type]} · {r.programme_code}</p>
                <p className="text-sm text-ink-muted">{r.programme_title}</p>
                {r.cohort_name && <p className="text-sm text-ink-muted">{r.cohort_name}</p>}
              </td>
              <td className="whitespace-nowrap px-3 sm:px-4 py-3 text-right font-semibold">{formatNairaExact(r.base_amount_kobo)}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-3 sm:px-4 py-3 font-semibold text-ink">Processing charge</td>
              <td className="whitespace-nowrap px-3 sm:px-4 py-3 text-right font-semibold">{formatNairaExact(r.processing_fee_kobo)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-b-2 border-navy">
              <th scope="row" className="px-3 sm:px-4 py-3 text-lg font-bold text-navy">Total paid</th>
              <td className="whitespace-nowrap px-3 sm:px-4 py-3 text-right font-display text-lg font-bold text-navy">{formatNairaExact(r.amount_kobo)}</td>
            </tr>
          </tfoot>
        </table>

        <section className="mt-8 flex flex-col gap-5 rounded-xl border border-line p-5 sm:flex-row sm:items-center print:break-inside-avoid">
          <div className="h-32 w-32 shrink-0 self-center sm:self-auto [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="QR code to verify this receipt" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div>
            <h2 className="text-lg font-bold text-navy">Check that this receipt is genuine</h2>
            <p className="mt-1 text-base text-ink-muted">Scan the QR code with a phone camera. It opens the Institute’s website and shows the details on record for this receipt. If they don’t match, the receipt is not valid.</p>
            <a href={verifyUrl} className="mt-2 inline-block break-all text-sm font-semibold text-teal underline-offset-4 hover:underline">{verifyUrl.replace(/^https?:\/\//, '')}</a>
          </div>
        </section>

        <footer className="mt-6 border-t border-line pt-4 text-sm text-ink-muted">
          <p>This receipt was issued electronically and is valid without a signature or stamp.</p>
          <p className="mt-1">{site.address.value}</p>
        </footer>
      </div>
    </article>
  )
}
