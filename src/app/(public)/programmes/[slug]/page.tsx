import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, Target, Users, Wallet } from 'lucide-react'
import { Accordion, Avatar, ButtonLink, PlaceholderTag } from '@/components/ui'
import { ProgrammeCard } from '@/components/site/ProgrammeCard'
import { images } from '@/lib/images'
import { FORMAT, getProgramme, programmes } from '@/lib/programmes'
import { feeTotal, getPublicFees, programmeFees } from '@/lib/fees-public'
import { site } from '@/lib/site'
import { formatDate, formatNaira } from '@/lib/utils'

export const revalidate = 600

export function generateStaticParams() {
  return programmes.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProgramme((await params).slug)
  if (!p) return {}
  return { title: p.title, description: `${p.promise} ${FORMAT.durationWeeks} weeks, Saturdays, Taraba State University.` }
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProgramme((await params).slug)
  if (!p) notFound()
  const hero = images.programmeHeroes[p.code] ?? images.programmes[p.code]
  const intake = site.nextIntake
  const fees = await getPublicFees()
  const own = programmeFees(fees, p.code)
  const appFee = feeTotal(own.application)
  const tuition = feeTotal(own.tuition)

  const facts = [
    { Icon: Clock, label: 'Duration', value: `${FORMAT.durationWeeks} weeks` },
    { Icon: CalendarDays, label: 'Schedule', value: 'Saturdays, 9am–4pm' },
    { Icon: MapPin, label: 'Mode', value: 'In person + portal' },
    { Icon: Wallet, label: 'Tuition', value: formatNaira(own.tuition.base) },
    { Icon: Users, label: 'Cohort', value: `Up to ${FORMAT.cohortSize}` },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: p.title,
    description: p.overview,
    courseCode: p.code,
    provider: { '@type': 'CollegeOrUniversity', name: 'Taraba State University', sameAs: site.tsuUrl },
    offers: { '@type': 'Offer', price: (own.tuition.base / 100).toString(), priceCurrency: 'NGN', category: 'Paid' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src={hero.src} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/40" aria-hidden />
        <div className="container-page py-12 sm:py-20">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-label text-white/80">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <Link href="/programmes" className="hover:text-white">Programmes</Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="text-white">{p.code}</span>
          </nav>
          <p className="mt-8 inline-block rounded-md bg-teal px-3 py-1 font-display text-sm font-bold">{p.code}</p>
          <h1 className="mt-4 max-w-3xl text-[1.875rem] font-bold leading-[2.375rem] text-white sm:text-h1">{p.title}</h1>
          <p className="mt-5 max-w-2xl text-lead text-white/90">{p.promise}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/register?programme=${p.code}`} size="lg">Apply for {p.code}</ButtonLink>
            <ButtonLink href="#modules" size="lg" variant="light">See the modules</ButtonLink>
          </div>
        </div>
      </section>

      {/* Key facts */}
      <section aria-label="Key facts" className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map(({ Icon, label, value }) => (
            <div key={label} className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-5 w-5" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="font-semibold text-navy">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 pb-32 sm:py-16 lg:grid-cols-[1fr_360px] lg:pb-16">
        <div className="min-w-0 space-y-14">
          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Overview</h2>
            <p className="mt-4 text-lead text-ink">{p.overview}</p>
          </section>

          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Who it’s for</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {p.audience.map((a) => (
                <li key={a} className="rounded-card border border-line bg-canvas p-4 font-medium text-navy">{a}</li>
              ))}
            </ul>
          </section>

          <section id="modules" className="scroll-mt-28">
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">What you’ll learn</h2>
            <p className="mt-2 text-base text-ink-muted">Four modules, two Saturdays each.</p>
            <ol className="mt-6 space-y-4">
              {p.modules.map((m) => (
                <li key={m.number} className="flex gap-4 rounded-card border border-line bg-white p-5 shadow-card sm:gap-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-white">{m.number}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{m.title}</h3>
                    <p className="mt-1 text-base text-ink-muted">{m.summary}</p>
                    <p className="mt-2 text-sm font-medium text-teal">Weeks {m.number * 2 - 1}–{m.number * 2}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-card bg-teal-50 p-6">
              <h2 className="text-h3 font-semibold">By the end you will</h2>
              <ul className="mt-4 space-y-3">
                {p.outcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-base text-ink">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden /> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-card bg-navy p-6 text-white">
              <Target className="h-8 w-8 text-teal-100" aria-hidden />
              <h2 className="mt-3 text-h3 font-semibold text-white">Your capstone</h2>
              <p className="mt-3 text-base text-white/90">{p.capstone}</p>
              <p className="mt-3 text-sm text-white/75">Applied to your own workplace or community, and presented to facilitators and peers.</p>
            </div>
          </section>

          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Assessment and award</h2>
            <div className="mt-5 overflow-hidden rounded-card border border-line">
              {FORMAT.assessment.map((a) => (
                <div key={a.label} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0">
                  <span className="text-base text-ink">{a.label}</span>
                  <span className="font-display text-lg font-bold text-navy">{a.weight}%</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-base text-ink-muted">{FORMAT.award}</p>
          </section>

          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Facilitators</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {['Lead Facilitator', 'Co-Facilitator'].map((role) => (
                <div key={role} className="flex items-center gap-4 rounded-card border border-line p-5">
                  <Avatar name={role} size={56} />
                  <div>
                    <p className="font-semibold text-navy">Facilitator name<PlaceholderTag /></p>
                    <p className="text-label text-ink-muted">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Fees and entry requirements</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="rounded-card border border-line p-6">
                <h3 className="text-lg font-semibold">Fees</h3>
                <dl className="mt-4 space-y-3 text-base">
                  <div className="flex justify-between gap-4"><dt className="text-ink-muted">Application fee</dt><dd className="font-semibold text-navy">{formatNaira(appFee)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-ink-muted">Tuition (after admission)</dt><dd className="font-semibold text-navy">{formatNaira(tuition)}</dd></div>
                </dl>
                <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">Each payment includes a ₦300 processing charge. Pay by card, bank transfer or USSD.</p>
              </div>
              <div className="rounded-card border border-line p-6">
                <h3 className="text-lg font-semibold">Entry requirements</h3>
                <ul className="mt-4 space-y-2.5 text-base text-ink">
                  {FORMAT.entry.map((e) => (
                    <li key={e} className="flex gap-2.5"><CheckCircle2 className="mt-1 h-[18px] w-[18px] shrink-0 text-teal" aria-hidden />{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[1.5rem] font-semibold sm:text-h2">Frequently asked</h2>
            <div className="mt-5">
              <Accordion
                items={[
                  { q: 'Do I need a background in peace studies?', a: 'No. Every programme starts from first principles and builds on your own experience.' },
                  { q: 'What if I miss a Saturday?', a: 'Let your facilitator know and catch up through your class group. Any attendance requirement is set for each intake and explained at the start.' },
                  { q: 'Is the certificate recognised?', a: 'It is awarded by Taraba State University and carries a unique number and QR code that employers can verify online.' },
                ]}
              />
            </div>
          </section>
        </div>

        {/* Sticky apply card (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-card border border-line bg-white p-6 shadow-raised">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Next intake</p>
            <p className="mt-1 font-display text-h3 font-semibold text-navy">{intake.label}</p>
            <dl className="mt-5 space-y-3 border-y border-line py-5 text-base">
              <div className="flex justify-between"><dt className="text-ink-muted">Starts</dt><dd className="font-semibold text-navy">{formatDate(intake.startDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Apply by</dt><dd className="font-semibold text-navy">{formatDate(intake.deadline)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Seats</dt><dd className="font-semibold text-navy">{intake.seats}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Tuition</dt><dd className="font-semibold text-navy">{formatNaira(tuition)}</dd></div>
            </dl>
            <ButtonLink href={`/register?programme=${p.code}`} size="lg" className="mt-5 w-full">Apply for {p.code}</ButtonLink>
            <p className="mt-3 text-center text-sm text-ink-muted">Application fee {formatNaira(appFee)}</p>
          </div>
        </aside>
      </div>

      {/* Related */}
      <section className="section bg-canvas">
        <div className="container-page">
          <h2 className="text-[1.5rem] font-semibold sm:text-h2">Other programmes</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.filter((x) => x.code !== p.code).map((x) => (
              <ProgrammeCard key={x.code} p={x} tuition={programmeFees(fees, x.code).tuition.base} />
            ))}
          </div>
        </div>
      </section>

      {/* Sticky apply bar (phone and tablet) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-container items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{p.code} · {intake.label}</p>
            <p className="text-sm text-ink-muted">Tuition {formatNaira(tuition)}</p>
          </div>
          <ButtonLink href={`/register?programme=${p.code}`} className="shrink-0">Apply now</ButtonLink>
        </div>
      </div>
    </>
  )
}
