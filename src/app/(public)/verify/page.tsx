import { Award, FileCheck2, QrCode, Receipt, Search, ShieldCheck, ShieldX } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { createPublicClient } from '@/lib/supabase/public'
import { formatDate } from '@/lib/utils'
import { site } from '@/lib/site'

export const metadata = { title: 'Verify a certificate', description: 'Check that a certificate, admission letter or receipt from the Institute of Peace and Conflict Management, TSU, is genuine.' }

type CertResult = { holder: string; programme: string; cohort: string; issued_at: string; classification: string | null; valid: boolean }

async function lookup(no: string): Promise<CertResult | null | 'error'> {
  const db = createPublicClient()
  if (!db) return 'error'
  const { data, error } = await db.rpc('verify_certificate', { p_certificate_no: no })
  if (error) return 'error'
  return ((data as CertResult[] | null) ?? [])[0] ?? null
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const raw = ((await searchParams).no ?? '').trim().toUpperCase().slice(0, 40)
  const no = raw.replace(/\s+/g, '')
  const result = no ? await lookup(no) : undefined

  return (
    <>
      <PageHero eyebrow="Verification" crumb="Verify" title="Check that a document is genuine" intro="Employers, sponsors and agencies can confirm any certificate, admission letter or receipt issued by the Institute, free and instantly." />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div>
            <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal"><Award className="h-6 w-6" aria-hidden /></span>
                <h2 className="text-[1.375rem] font-semibold leading-8 sm:text-h3">Verify a certificate</h2>
              </div>
              <p className="mt-3 text-base text-ink-muted">Scan the QR code on the certificate with any phone camera for the fullest check, including the holder’s photograph. Or enter the certificate number, for example IPCM-PCM-2027-0042.</p>
              <form method="get" action="/verify" className="mt-5 flex flex-col gap-3 sm:flex-row" role="search">
                <label htmlFor="cert-no" className="sr-only">Certificate number</label>
                <Input id="cert-no" name="no" defaultValue={raw} placeholder="IPCM-PCM-2027-0042" autoCapitalize="characters" spellCheck={false} className="font-mono uppercase sm:flex-1" required />
                <Button type="submit" size="lg"><Search className="h-5 w-5" aria-hidden /> Check</Button>
              </form>

              {result !== undefined && (
                <div className="mt-6" aria-live="polite">
                  {result === 'error' ? (
                    <p className="rounded-xl bg-amber-50 p-4 text-base text-ink">We couldn’t check right now. Please try again in a moment.</p>
                  ) : result && result.valid ? (
                    <div className="overflow-hidden rounded-xl border border-success/40">
                      <div className="flex items-center gap-3 bg-success-50 p-4"><ShieldCheck className="h-8 w-8 shrink-0 text-success" aria-hidden /><p className="text-lg font-bold text-success">Genuine certificate</p></div>
                      <dl className="grid gap-4 p-4 sm:grid-cols-2">
                        <div><dt className="text-sm text-ink-muted">Awarded to</dt><dd className="font-semibold text-ink">{result.holder}</dd></div>
                        <div><dt className="text-sm text-ink-muted">Certificate number</dt><dd className="break-all font-mono font-semibold text-ink">{no}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Programme</dt><dd className="font-semibold text-ink">{result.programme}</dd></div>
                        <div><dt className="text-sm text-ink-muted">Intake</dt><dd className="font-semibold text-ink">{result.cohort}</dd></div>
                        <div><dt className="text-sm text-ink-muted">Issued</dt><dd className="font-semibold text-ink">{formatDate(result.issued_at)}{result.classification ? ` · ${result.classification}` : ''}</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <div className="flex gap-3 rounded-xl border border-crimson/40 bg-crimson-50 p-4">
                      <ShieldX className="h-8 w-8 shrink-0 text-crimson" aria-hidden />
                      <div>
                        <p className="text-lg font-bold text-crimson">{result ? 'Certificate revoked' : 'No certificate found'}</p>
                        <p className="text-base text-ink">{result ? 'This certificate was issued but has since been withdrawn by the Institute. If the holder has a newer certificate, check that number instead.' : `We have no certificate numbered “${no}”. Check the number and try again. If it still doesn’t match, the certificate may not be genuine; contact ${site.email.value}.`}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <h2 className="text-lg font-semibold text-navy">Admission letters and receipts</h2>
            <p className="text-base text-ink-muted">These carry a QR code instead of a number to type. Scan it with any phone camera: it opens a page on this website showing the details on record.</p>
            {[
              { Icon: FileCheck2, title: 'Admission letter', body: 'Shows the student’s name, registration number, programme and intake.' },
              { Icon: Receipt, title: 'Payment receipt', body: 'Shows the receipt number, amount, what it was for, the date and the payer’s name.' },
              { Icon: QrCode, title: 'Compare carefully', body: 'If anything on the paper differs from the page (name, amount, number), the document has been altered and should not be accepted.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-card border border-line bg-white p-5 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-5 w-5" aria-hidden /></span>
                <div><h3 className="font-semibold text-navy">{title}</h3><p className="text-base text-ink-muted">{body}</p></div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </>
  )
}
