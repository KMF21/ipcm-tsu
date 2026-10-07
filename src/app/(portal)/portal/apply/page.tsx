import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Pencil } from 'lucide-react'
import { Alert, Badge, Card, Stepper } from '@/components/ui'
import { DeclarationForm, PersonalStep, ProfessionalStep, ProgrammeStep, QualificationsStep, SponsorshipStep, StatementStep } from '@/components/apply/StepForms'
import { DocumentsStep } from '@/components/apply/DocumentsStep'
import { createClient } from '@/lib/supabase/server'
import { getMyApplication, getMyDocuments, getOpenCohorts, getStatesWithLgas } from '@/lib/application/queries'
import { DOC_RULES, EMPLOYMENT, SECTORS, STEPS, furthestStep, requiredDocs, type DocType, type StepData } from '@/lib/application/steps'
import { programmes } from '@/lib/programmes'
import { formatDate } from '@/lib/utils'
import { ApplicationStatus } from '@/components/apply/ApplicationStatus'

export const metadata = { title: 'Apply' }

const ALL_DOCS: DocType[] = ['passport_photo', 'qualification', 'identification', 'cv', 'sponsorship_letter']

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply')

  const app = await getMyApplication(supabase, user.id)
  if (app && app.status !== 'draft') return <ApplicationStatus app={app} />

  const data = (app?.step_data ?? {}) as StepData
  const furthest = app ? furthestStep(data) : 1
  const requested = Number(sp.step) || furthest
  const step = Math.min(Math.max(1, requested), furthest)
  const def = STEPS[step - 1]

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('title, surname, first_name, other_names, sex, dob, phone, state_id, lga_id, address, nin, organisation, job_role, sector, years_experience')
    .eq('id', user.id)
    .single()
  const profile = (profileRow ?? {}) as Record<string, string | number | null>

  let body: React.ReactNode = null
  if (step === 1) {
    const cohorts = await getOpenCohorts(supabase)
    body = <ProgrammeStep programmes={programmes.map((p) => ({ code: p.code, title: p.shortTitle, promise: p.promise }))} cohorts={cohorts} saved={data.programme} preselect={sp.programme} />
  } else if (step === 2) {
    body = <PersonalStep saved={data.personal} profile={profile} states={await getStatesWithLgas(supabase)} />
  } else if (step === 3) {
    body = <ProfessionalStep saved={data.professional} profile={profile} />
  } else if (step === 4) {
    body = <QualificationsStep saved={data.qualifications} />
  } else if (step === 5) {
    body = <SponsorshipStep saved={data.sponsorship} />
  } else if (step === 6) {
    const required = requiredDocs(data)
    body = <DocumentsStep required={required} optional={ALL_DOCS.filter((t) => !required.includes(t) && t !== 'cv' && t !== 'sponsorship_letter')} documents={app ? await getMyDocuments(supabase, app.id) : []} />
  } else if (step === 7) {
    body = <StatementStep saved={data.statement} />
  } else {
    body = <ReviewSummary data={data} app={app!} documents={app ? await getMyDocuments(supabase, app.id) : []} profileEmail={user.email ?? ''} />
  }

  return (
    <div className="mx-auto max-w-3xl">
      {sp.saved && (
        <div className="mb-6">
          <Alert tone="success" title="Your progress is saved">Come back any time to finish. Log in and you’ll return to this page.</Alert>
        </div>
      )}
      {sp.welcome && (
        <div className="mb-6">
          <Alert tone="success" title="Your account is ready">Let’s start your application. Everything saves as you go, so you can stop and come back at any time.</Alert>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Application · Step {step} of {STEPS.length}</p>
        {app && <Badge tone="navy">{app.ref}</Badge>}
      </div>
      <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">{def.heading}</h1>
      {app?.programmes && step > 1 && (
        <p className="mt-2 text-base text-ink-muted">
          {app.programmes.code} · {app.programmes.short_title}{app.cohorts ? ` · ${app.cohorts.name}` : ''}
        </p>
      )}

      <Card className="mt-6">
        <div className="mb-8">
          <Stepper steps={STEPS.map((s) => s.title)} current={step - 1} />
        </div>
        {body}
      </Card>
      <p className="mt-4 text-center text-sm text-ink-muted">Need help? Call or WhatsApp the IPCM office, or visit in person.</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="break-words text-base text-ink">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={`/portal/apply?step=${step}`} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">
          <Pencil className="h-4 w-4" aria-hidden /> Edit
        </Link>
      </div>
      <dl className="mt-2">{children}</dl>
    </section>
  )
}

async function ReviewSummary({ data, app, documents, profileEmail }: { data: StepData; app: NonNullable<Awaited<ReturnType<typeof getMyApplication>>>; documents: Awaited<ReturnType<typeof getMyDocuments>>; profileEmail: string }) {
  const p = data.personal
  const w = data.professional
  const q = data.qualifications
  const s = data.sponsorship
  const label = (list: readonly (readonly [string, string])[], v?: string) => list.find(([k]) => k === v)?.[1] ?? v
  const supabase = await createClient()
  const { data: place } = p ? await supabase.from('lgas').select('name, states(name)').eq('id', p.lga_id).single() : { data: null }
  return (
    <div className="space-y-5">
      <p className="text-base text-ink">Check everything carefully. You can edit any section before you submit.</p>
      <Section title="Programme" step={1}>
        <Row label="Programme" value={app.programmes ? `${app.programmes.code} · ${app.programmes.title}` : ''} />
        <Row label="Intake" value={app.cohorts ? `${app.cohorts.name} (starts ${formatDate(app.cohorts.start_date)})` : ''} />
      </Section>
      <Section title="Personal details" step={2}>
        <Row label="Name" value={p ? [p.title, p.first_name, p.other_names, p.surname].filter(Boolean).join(' ') : ''} />
        <Row label="Email" value={profileEmail} />
        <Row label="Phone" value={p?.phone} />
        <Row label="Sex" value={p?.sex === 'female' ? 'Female' : p?.sex === 'male' ? 'Male' : ''} />
        <Row label="Date of birth" value={p?.dob ? formatDate(p.dob) : ''} />
        <Row label="State and LGA" value={place ? `${place.name}, ${(place.states as unknown as { name: string }).name}` : ''} />
        <Row label="Address" value={p?.address} />
        <Row label="NIN" value={p?.nin} />
      </Section>
      <Section title="Work and experience" step={3}>
        <Row label="Status" value={label(EMPLOYMENT, w?.employment_status)} />
        <Row label="Sector" value={label(SECTORS, w?.sector)} />
        <Row label="Organisation" value={w?.organisation} />
        <Row label="Role" value={w?.job_role} />
        <Row label="Experience" value={w ? `${w.years_experience} years` : ''} />
      </Section>
      <Section title="Education" step={4}>
        <Row label="Highest qualification" value={q ? `${q.highest_qualification}, ${q.institution} (${q.year})` : ''} />
        <Row label="O’Level" value={q ? `${q.olevel_type}${q.olevel_year ? ` (${q.olevel_year})` : ''}` : ''} />
        <Row label="Mature entry" value={q ? (q.is_mature_entry ? 'Yes' : 'No') : ''} />
      </Section>
      <Section title="Sponsorship" step={5}>
        <Row label="Paying" value={s ? (s.sponsored === 'yes' ? `Sponsored by ${s.sponsor_organisation}` : 'Self-sponsored') : ''} />
        {s?.sponsored === 'yes' && <Row label="Contact" value={[s.sponsor_contact_name, s.sponsor_contact_phone, s.sponsor_contact_email].filter(Boolean).join(' · ')} />}
      </Section>
      <Section title="Documents" step={6}>
        {requiredDocs(data).map((t) => {
          const n = documents.filter((d) => d.type === t).length
          return <Row key={t} label={DOC_RULES[t].label} value={n ? <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 className="h-4 w-4" aria-hidden />{n > 1 ? `${n} files` : 'Uploaded'}</span> : <span className="font-medium text-crimson">Missing</span>} />
        })}
      </Section>
      <Section title="Statement" step={7}>
        <p className="whitespace-pre-line py-2 text-base text-ink">{data.statement?.statement || '—'}</p>
      </Section>
      <DeclarationForm />
    </div>
  )
}
