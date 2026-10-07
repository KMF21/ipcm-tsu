import * as T from '@/lib/email/templates'

export const metadata = { title: 'Email preview', robots: { index: false, follow: false } }

/** Every applicant email with sample data, as the applicant would see it. */
export default async function EmailPreview({ searchParams }: { searchParams: Promise<{ only?: string }> }) {
  const { only } = await searchParams
  const ctx = { baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100' }
  const programme = 'Certificate in Negotiation, Mediation and Alternative Dispute Resolution'
  const emails: [string, T.Email][] = [
    ['paid', T.applicationFeePaid(ctx, { firstName: 'Tersoo', programme, receiptNo: 'RCT-2026-000123', amountKobo: 1_530_000 })],
    ['submitted', T.applicationSubmitted(ctx, { firstName: 'Tersoo', ref: 'APP-26-B4T9LA', programme })],
    ['changes', T.changesRequested(ctx, { firstName: 'Tersoo', items: [{ label: 'O’Level result or highest qualification', reason: 'File is unreadable or incomplete. Upload a clear scan of the whole document.' }], note: 'Please include both pages of the result.' })],
    ['offer', T.offerMade(ctx, { firstName: 'Tersoo', programme, cohort: 'February 2027 cohort', startDate: 'Saturday, 6 February 2027', payBy: '6 November 2026', amountKobo: 3_530_000 })],
    ['reminder', T.offerReminder(ctx, { firstName: 'Tersoo', programme, payBy: '6 November 2026', daysLeft: 2, amountKobo: 3_530_000 })],
    ['extended', T.offerExtended(ctx, { firstName: 'Tersoo', programme, payBy: '20 November 2026' })],
    ['lapsed', T.offerLapsed(ctx, { firstName: 'Tersoo', programme, payBy: '6 November 2026' })],
    ['declined', T.applicationDeclined(ctx, { firstName: 'Tersoo', programme, reason: 'The entry requirements for this programme were not met.' })],
    ['admitted', T.admitted(ctx, { firstName: 'Tersoo', regNo: 'TSU/IPCM/NMA/2027/0001', programme, cohort: 'February 2027 cohort', startDate: 'Saturday, 6 February 2027', venue: 'IPCM Lecture Hall, Taraba State University, Jalingo', receiptNo: 'RCT-2026-000124', amountKobo: 3_530_000 })],
  ]
  const shown = only ? emails.filter(([k]) => k === only) : emails
  return (
    <main className="bg-canvas px-4 py-8">
      <div className="mx-auto max-w-[680px] space-y-8">
        {shown.map(([k, e]) => (
          <section key={k}>
            <p className="mb-2 text-sm font-semibold text-ink-muted">{k} · Subject: <span className="text-navy">{e.subject}</span></p>
            <iframe title={e.subject} srcDoc={e.html} className="h-[1000px] w-full rounded-xl border border-line bg-white" />
          </section>
        ))}
      </div>
    </main>
  )
}
