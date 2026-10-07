import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, GraduationCap, Users } from 'lucide-react'
import { ButtonLink, SectionHeading } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { ProgrammeCard } from '@/components/site/ProgrammeCard'
import { images } from '@/lib/images'
import { FEES, FORMAT, programmes } from '@/lib/programmes'
import { formatNaira } from '@/lib/utils'

export const metadata = {
  title: 'Programmes',
  description: 'Five professional certificate programmes in peace and conflict management at Taraba State University: eight Saturdays, four modules and a practical capstone.',
}

export default function ProgrammesPage() {
  const format = [
    { Icon: Clock, label: 'Duration', value: `${FORMAT.durationWeeks} weeks, ${FORMAT.contactHours} contact hours` },
    { Icon: CalendarDays, label: 'Schedule', value: FORMAT.schedule },
    { Icon: Users, label: 'Class size', value: `Up to ${FORMAT.cohortSize} participants` },
    { Icon: GraduationCap, label: 'Award', value: 'Certificate of Taraba State University' },
  ]
  return (
    <>
      <PageHero eyebrow="Programmes" crumb="Programmes" title="Five certificates. One purpose." intro="Short, practical programmes for working adults. Each has four modules and a capstone project you can use at work the next Monday." image={images.programmeHeroes.CEW} />

      <section aria-label="Shared format" className="border-b border-line bg-white">
        <dl className="container-page grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {format.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-5 w-5" aria-hidden /></span>
              <div><dt className="text-sm text-ink-muted">{label}</dt><dd className="font-semibold text-navy">{value}</dd></div>
            </div>
          ))}
        </dl>
      </section>

      <section className="section bg-canvas">
        <div className="container-page">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((p) => <li key={p.code}><ProgrammeCard p={p} /></li>)}
            <li className="flex flex-col justify-between rounded-card bg-navy p-7 text-white shadow-card">
              <div>
                <h2 className="text-h3 font-semibold text-white">New to peace work?</h2>
                <p className="mt-3 text-base text-white/85">Start with Peace and Conflict Management, the foundation course. Graduates of any three certificates may later qualify for an Advanced Certificate, subject to Senate approval.</p>
              </div>
              <ButtonLink href="/programmes/peace-conflict-management" variant="light" className="mt-6">See the foundation course</ButtonLink>
            </li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Compare" title="Which programme is right for you?" intro="All five share the same format, fees and timetable. Choose by the work you do." />
          {/* Desktop table */}
          <div className="mt-10 hidden overflow-hidden rounded-card border border-line bg-white shadow-card lg:block">
            <table className="w-full text-left text-base">
              <thead className="bg-canvas text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Programme</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Built for</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Capstone</th>
                  <th scope="col" className="w-12 px-5 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {programmes.map((p) => (
                  <tr key={p.code} className="group relative align-top hover:bg-teal-50/50">
                    <th scope="row" className="px-5 py-5 font-normal">
                      <span className="font-display text-sm font-bold text-teal">{p.code}</span>
                      <Link href={`/programmes/${p.slug}`} className="mt-1 block font-semibold text-navy after:absolute after:inset-0">{p.shortTitle}</Link>
                    </th>
                    <td className="px-5 py-5 text-ink">{p.audience.join('; ')}</td>
                    <td className="px-5 py-5 text-ink-muted">{p.capstone}</td>
                    <td className="px-5 py-5"><ArrowRight className="h-5 w-5 text-teal transition group-hover:translate-x-1" aria-hidden /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Phone and tablet */}
          <ul className="mt-8 space-y-4 lg:hidden">
            {programmes.map((p) => (
              <li key={p.code} className="rounded-card border border-line bg-white p-5 shadow-card">
                <span className="font-display text-sm font-bold text-teal">{p.code}</span>
                <h3 className="mt-1 text-lg font-semibold text-navy">{p.shortTitle}</h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Built for</p>
                <p className="text-base text-ink">{p.audience.join('; ')}</p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Capstone</p>
                <p className="text-base text-ink">{p.capstone}</p>
                <Link href={`/programmes/${p.slug}`} className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal">View programme <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-teal">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl text-[1.75rem] font-semibold leading-9 text-white sm:text-h2">{formatNaira(FEES.tuition.base)} tuition. Eight Saturdays. A TSU certificate.</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="light" size="lg">Apply now</ButtonLink>
            <ButtonLink href="/admissions" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10">How admissions work</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
