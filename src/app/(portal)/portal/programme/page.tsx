import { redirect } from 'next/navigation'
import { Award, CalendarDays, CheckCircle2, Clock, Target } from 'lucide-react'
import { ButtonLink, Card } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { createClient } from '@/lib/supabase/server'
import { getMyEnrolment } from '@/lib/portal/queries'
import { getMyApplication } from '@/lib/application/queries'
import { FORMAT, programmes } from '@/lib/programmes'

export const metadata = { title: 'My programme' }

export default async function MyProgrammePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/programme')
  const enrolment = await getMyEnrolment(supabase, user.id)
  const app = enrolment ? null : await getMyApplication(supabase, user.id)
  const p = enrolment?.programme ?? programmes.find((x) => x.code === app?.programmes?.code)
  if (!p) redirect('/portal/apply')

  return (
    <div className="mx-auto max-w-4xl">
      <PortalHeader eyebrow={p.code} title={p.shortTitle} intro={enrolment ? `${enrolment.cohort.name} · ${enrolment.reg_no}` : 'The programme you applied for. Your timetable and materials appear here once you are admitted.'} />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { Icon: Clock, label: 'Duration', value: `${FORMAT.durationWeeks} weeks · ${FORMAT.contactHours} hours` },
          { Icon: CalendarDays, label: 'Schedule', value: FORMAT.schedule },
          { Icon: Award, label: 'Award', value: 'TSU certificate' },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-card border border-line bg-white p-4 shadow-card">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-5 w-5" aria-hidden /></span>
            <div><p className="text-sm text-ink-muted">{label}</p><p className="font-semibold text-navy">{value}</p></div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-h3 font-semibold">Modules</h2>
        <ol className="mt-4 space-y-3">
          {p.modules.map((m) => (
            <li key={m.number} className="flex gap-4 rounded-card border border-line bg-white p-5 shadow-card">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-h3 font-semibold"><Target className="h-5 w-5 text-teal" aria-hidden /> Capstone project</h2>
          <p className="mt-3 text-base text-ink">{p.capstone}</p>
          <h3 className="mt-5 font-semibold text-navy">By the end you will be able to</h3>
          <ul className="mt-2 space-y-2">
            {p.outcomes.map((o) => <li key={o} className="flex gap-2 text-base text-ink"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />{o}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="text-h3 font-semibold">How you are assessed</h2>
          <ul className="mt-4 space-y-3">
            {FORMAT.assessment.map((a) => (
              <li key={a.label}>
                <div className="mb-1.5 flex justify-between text-base"><span>{a.label}</span><span className="font-semibold text-navy">{a.weight}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-teal" style={{ width: `${a.weight * 2}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-canvas p-4 text-base text-ink">{FORMAT.award}</p>
        </Card>
      </div>
      {!enrolment && <ButtonLink href="/portal/apply" className="mt-8">Back to my application</ButtonLink>}
    </div>
  )
}
