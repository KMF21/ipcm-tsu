import { CalendarDays, CheckCircle2, ClipboardCheck, CreditCard, FileCheck2, FileText, GraduationCap, Info, Mail, UserPlus } from 'lucide-react'
import { ButtonLink, SectionHeading } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { images } from '@/lib/images'
import { FEES, FORMAT, programmes } from '@/lib/programmes'
import { DOC_RULES, formatBytes, type DocType } from '@/lib/application/steps'
import { site } from '@/lib/site'
import { createPublicClient } from '@/lib/supabase/public'
import { formatDate, formatNaira } from '@/lib/utils'

export const metadata = {
  title: 'Admissions',
  description: 'Entry requirements, fees, documents and how to apply to the certificate programmes of the Institute of Peace and Conflict Management, TSU.',
}
export const revalidate = 600

type Intake = { id: string; name: string; start_date: string; application_deadline: string; accept_late: boolean; programmes: { code: string; short_title: string } | null }

async function openIntakes(): Promise<Intake[]> {
  const db = createPublicClient()
  if (!db) return []
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db
    .from('cohorts')
    .select('id, name, start_date, application_deadline, accept_late, programmes(code, short_title)')
    .eq('status', 'open')
    .or(`application_deadline.gte.${today},accept_late.eq.true`)
    .order('start_date')
  return (data ?? []) as unknown as Intake[]
}

const steps = [
  { Icon: UserPlus, title: 'Create an account', body: 'Register with your name, email and a password. It takes a minute.' },
  { Icon: CreditCard, title: 'Choose and pay', body: `Pick your programme and intake, check you meet the requirements, then pay the ${formatNaira(FEES.application.base + FEES.application.processing)} application fee online.` },
  { Icon: FileText, title: 'Complete and submit', body: 'Fill in your details, upload your documents and submit. Your progress saves as you go. Submitting is free.' },
  { Icon: ClipboardCheck, title: 'Review', body: 'Admissions checks your documents. If something needs fixing, you are told exactly what and can replace it.' },
  { Icon: Mail, title: 'Receive an offer', body: 'You are emailed an offer of admission and have 30 days to accept it by paying tuition.' },
  { Icon: GraduationCap, title: 'Pay tuition, get admitted', body: 'Once tuition is paid you are admitted at once, with your registration number and admission letter.' },
]

const DOCS: { type: DocType; when: string }[] = [
  { type: 'passport_photo', when: 'Everyone' },
  { type: 'qualification', when: 'Everyone' },
  { type: 'identification', when: 'Everyone' },
  { type: 'cv', when: 'Mature applicants (25+)' },
  { type: 'sponsorship_letter', when: 'Sponsored officers' },
]
const fmt = (m: string[]) => m.map((x) => (x === 'application/pdf' ? 'PDF' : x === 'image/png' ? 'PNG' : 'JPG')).join(' or ')

export default async function AdmissionsPage() {
  const intakes = await openIntakes()
  const appFee = FEES.application.base + FEES.application.processing
  const tuition = FEES.tuition.base + FEES.tuition.processing
  return (
    <>
      <PageHero eyebrow="Admissions" crumb="Admissions" title="Apply in an evening. Start on a Saturday." intro="Everything you need to know before you apply: who can join, what it costs, which documents to prepare and what happens after you submit." image={images.programmeHeroes.PCM}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg">Start your application</ButtonLink>
          <ButtonLink href="#fees" size="lg" variant="light">See fees</ButtonLink>
        </div>
      </PageHero>

      {/* Intakes */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Intakes" title="Upcoming intakes" intro={`Three intakes a year (February, June and October). Classes run on ${FORMAT.schedule} for ${FORMAT.durationWeeks} weeks.`} />
          {intakes.length > 0 ? (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {intakes.map((c) => (
                <li key={c.id} className="rounded-card border border-line bg-white p-6 shadow-card">
                  <p className="text-sm font-bold text-teal">{c.programmes?.code}</p>
                  <h3 className="mt-1 text-lg font-semibold">{c.programmes?.short_title}</h3>
                  <p className="mt-1 text-base text-ink-muted">{c.name}</p>
                  <dl className="mt-4 space-y-1.5 text-base">
                    <div className="flex justify-between gap-3"><dt className="text-ink-muted">Classes start</dt><dd className="font-semibold text-navy">{formatDate(c.start_date)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-ink-muted">Apply by</dt><dd className="font-semibold text-navy">{c.application_deadline < new Date().toISOString().slice(0, 10) && c.accept_late ? 'Late applications open' : formatDate(c.application_deadline)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10 flex flex-col gap-4 rounded-card border border-line bg-canvas p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-teal" aria-hidden />
                <p className="text-base text-ink"><strong className="text-navy">{site.nextIntake.label}.</strong> Applications close {formatDate(site.nextIntake.deadline)}. Classes start {formatDate(site.nextIntake.startDate)}.</p>
              </div>
              <ButtonLink href="/register">Apply now</ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* Entry requirements */}
      <section className="section bg-canvas">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Entry requirements" title="Who can apply" intro="You need to meet one of the first two conditions." />
            <ul className="mt-8 space-y-4">
              {FORMAT.entry.map((e) => (
                <li key={e} className="flex gap-3 rounded-card bg-white p-5 shadow-card">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal" aria-hidden />
                  <span className="text-base text-ink">{e.replace(/, or$/, '.')}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Choosing a programme" title="Five certificates, one format" intro="Every programme has four modules and a practical capstone. New to peace work? Start with the foundation course." />
            <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-white">
              {programmes.map((p) => (
                <li key={p.code}>
                  <a href={`/programmes/${p.slug}`} className="flex min-h-[60px] items-center gap-4 px-5 py-3 hover:bg-teal-50">
                    <span className="w-12 shrink-0 font-display text-sm font-bold text-teal">{p.code}</span>
                    <span className="text-base font-semibold text-navy">{p.shortTitle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From application to admission in six steps" align="center" />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ Icon, title, body }, i) => (
              <li key={title} className="rounded-card border border-line bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy font-display font-bold text-white">{i + 1}</span>
                  <Icon className="h-6 w-6 text-teal" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-base text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fees */}
      <section id="fees" className="section scroll-mt-24 bg-navy-50">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="Fees" title="Two payments. No hidden charges." intro="The same fees apply to every programme. Pay online by card, bank transfer or USSD through Paystack, and get a receipt with a QR code straight away." />
            <ul className="mt-6 space-y-3 text-base text-ink">
              <li className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />The application fee is not refundable. Check the requirements first.</li>
              <li className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />There is no acceptance fee.</li>
              <li className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />Organisations sponsoring several staff can be invoiced together.</li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            <table className="w-full text-left text-base">
              <caption className="sr-only">Fees per participant</caption>
              <thead className="bg-canvas text-sm text-ink-muted">
                <tr><th scope="col" className="px-4 py-3 font-semibold sm:px-6">Payment</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">You pay</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <th scope="row" className="px-4 py-4 font-normal sm:px-6"><span className="font-semibold text-navy">Application fee</span><span className="block text-sm text-ink-muted">{formatNaira(FEES.application.base)} + {formatNaira(FEES.application.processing)} processing. Paid when you start.</span></th>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-display text-lg font-bold text-navy sm:px-6">{formatNaira(appFee)}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-4 font-normal sm:px-6"><span className="font-semibold text-navy">Tuition</span><span className="block text-sm text-ink-muted">{formatNaira(FEES.tuition.base)} + {formatNaira(FEES.tuition.processing)} processing. Paid after your offer.</span></th>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-display text-lg font-bold text-navy sm:px-6">{formatNaira(tuition)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-teal-50">
                <tr><th scope="row" className="px-4 py-4 text-left font-semibold text-navy sm:px-6">Total per programme</th><td className="whitespace-nowrap px-4 py-4 text-right font-display text-xl font-bold text-navy sm:px-6">{formatNaira(appFee + tuition)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Documents" title="What to prepare before you apply" intro="Scan or photograph each document clearly. Phone photos are fine if they are sharp and the whole page is visible. We resize your passport photo for you." />
          <div className="mt-10 overflow-hidden rounded-card border border-line bg-white shadow-card">
            <ul className="divide-y divide-line">
              {DOCS.map(({ type, when }) => {
                const r = DOC_RULES[type]
                return (
                  <li key={type} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1.6fr)_1fr_1fr] sm:items-center sm:gap-4 sm:px-6">
                    <div className="flex items-start gap-3">
                      <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                      <div><p className="font-semibold text-navy">{r.label}</p><p className="text-sm text-ink-muted">{r.help}</p></div>
                    </div>
                    <p className="text-base text-ink sm:text-center"><span className="text-ink-muted sm:hidden">Format: </span>{fmt(r.mimes)}, up to {formatBytes(r.maxBytes)}</p>
                    <p className="text-base font-semibold text-navy sm:text-right"><span className="font-normal text-ink-muted sm:hidden">Needed by: </span>{when}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-teal">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl text-[1.75rem] font-semibold leading-9 text-white sm:text-h2">Ready to apply?</h2>
          <p className="max-w-xl text-lead text-white/90">Questions first? Read the FAQs or talk to the admissions office.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="light" size="lg">Start your application</ButtonLink>
            <ButtonLink href="/faq" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10">Read the FAQs</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
