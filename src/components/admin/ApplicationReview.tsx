import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui'
import { AppStatusBadge, personName } from './bits'
import { DocumentReview, type ReviewDoc } from './DocumentReview'
import { DecisionPanel, type DecisionInfo } from './DecisionPanel'
import type { ApplicationDetail } from '@/lib/admin/queries'
import { appStatus } from '@/lib/admin/status'
import { EMPLOYMENT, SECTORS, type StepData } from '@/lib/application/steps'
import { formatDate } from '@/lib/utils'
import { formatDateTime } from '@/lib/receipts/types'
import { ROLE_LABEL, type Role } from '@/lib/admin/roles'

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[190px_1fr]">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="break-words text-base text-ink">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  )
}

const label = (list: readonly (readonly [string, string])[], v?: string) => list.find(([k]) => k === v)?.[1] ?? v

export function ApplicationReview({ app, docs, decision, photoUrl }: { app: ApplicationDetail; docs: ReviewDoc[]; decision: DecisionInfo; photoUrl?: string }) {
  const d = (app.step_data ?? {}) as StepData
  const p = d.personal
  const w = d.professional
  const q = d.qualifications
  const s = d.sponsorship
  const person = app.profiles
  const name = p ? [p.title, p.first_name, p.other_names, p.surname].filter(Boolean).join(' ') : personName(person)
  const editable = ['submitted', 'under_review', 'changes_requested'].includes(app.status)

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/applications" className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-navy hover:text-teal"><ArrowLeft className="h-5 w-5" aria-hidden /> Applications</Link>

      <header className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={`Passport photo of ${name}`} className="h-24 w-20 shrink-0 rounded-xl border border-line object-cover" />
        ) : (
          <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-2xl font-bold text-white">{name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.5rem] font-bold leading-8 text-navy sm:text-h2">{name}</h1>
            <AppStatusBadge status={app.status} offerExpiresAt={app.offer_expires_at} />
          </div>
          <p className="mt-1 text-base text-ink-muted">{app.ref} · {app.programmes?.code}, {app.programmes?.short_title} · {app.cohorts?.name}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base">
            {person?.email && <a href={`mailto:${person.email}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-teal hover:underline"><Mail className="h-4 w-4" aria-hidden />{person.email}</a>}
            {(p?.phone || person?.phone) && <a href={`tel:${p?.phone || person?.phone}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-teal hover:underline"><Phone className="h-4 w-4" aria-hidden />{p?.phone || person?.phone}</a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          {app.application_fee_paid_at && <Badge tone="success"><CheckCircle2 className="h-4 w-4" aria-hidden /> Fee paid</Badge>}
          {app.submitted_at && <span className="text-sm text-ink-muted">Submitted {formatDate(app.submitted_at)}</span>}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          <section aria-labelledby="docs-h" className="space-y-3">
            <h2 id="docs-h" className="text-h3 font-semibold text-navy">Documents</h2>
            {docs.length === 0 && <p className="rounded-card border border-dashed border-line bg-white p-5 text-base text-ink-muted">No documents uploaded yet.</p>}
            {docs.map((doc) => <DocumentReview key={doc.id} doc={doc} applicationId={app.id} editable={editable} />)}
            {docs.some((x) => x.url) && <p className="text-sm text-ink-muted">Document links are private and stop working after 15 minutes. Reload the page for fresh links.</p>}
          </section>

          <Section title="Personal details">
            <Row label="Full name" value={name} />
            <Row label="Sex" value={p?.sex === 'female' ? 'Female' : p?.sex === 'male' ? 'Male' : ''} />
            <Row label="Date of birth" value={p?.dob ? formatDate(p.dob) : ''} />
            <Row label="State and LGA" value={person?.lgas ? `${person.lgas.name}, ${person.lgas.states?.name ?? ''}` : ''} />
            <Row label="Address" value={p?.address} />
            <Row label="NIN" value={p?.nin} />
          </Section>
          <Section title="Work and experience">
            <Row label="Status" value={label(EMPLOYMENT, w?.employment_status)} />
            <Row label="Sector" value={label(SECTORS, w?.sector)} />
            <Row label="Organisation" value={w?.organisation} />
            <Row label="Role" value={w?.job_role} />
            <Row label="Experience" value={w ? `${w.years_experience} years` : ''} />
          </Section>
          <Section title="Education">
            <Row label="Highest qualification" value={q ? `${q.highest_qualification}, ${q.institution} (${q.year})` : ''} />
            <Row label="O’Level" value={q ? `${q.olevel_type}${q.olevel_year ? ` (${q.olevel_year})` : ''}` : ''} />
            <Row label="Mature entry" value={q ? (q.is_mature_entry ? 'Yes (25+ with 2 years’ experience)' : 'No') : ''} />
          </Section>
          <Section title="Sponsorship">
            <Row label="Paying" value={s ? (s.sponsored === 'yes' ? `Sponsored by ${s.sponsor_organisation}` : 'Self-sponsored') : ''} />
            {s?.sponsored === 'yes' && <Row label="Sponsor contact" value={[s.sponsor_contact_name, s.sponsor_contact_phone, s.sponsor_contact_email].filter(Boolean).join(' · ')} />}
          </Section>
          <section className="rounded-card border border-line bg-white p-5 shadow-card">
            <h2 className="text-lg font-semibold text-navy">Personal statement</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-ink">{d.statement?.statement || app.statement || '—'}</p>
          </section>
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          <div className="lg:sticky lg:top-6 lg:space-y-6">
            <DecisionPanel info={decision} />
            <section aria-labelledby="timeline-h" className="mt-6 rounded-card border border-line bg-white p-5 shadow-card lg:mt-0">
              <h2 id="timeline-h" className="text-h3 font-semibold text-navy">Timeline</h2>
              <ol className="mt-4 space-y-4">
                {app.application_status_history.map((h) => (
                  <li key={h.id} className="relative border-l-2 border-line pl-4">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-teal" aria-hidden />
                    <p className="font-semibold text-navy">{h.from_status === h.to_status ? 'Offer updated' : appStatus(h.to_status).label}</p>
                    {h.note && <p className="text-sm text-ink">{h.note}</p>}
                    <p className="text-sm text-ink-muted">
                      {formatDateTime(h.created_at)}
                      {h.profiles ? ` · ${[h.profiles.first_name, h.profiles.surname].filter(Boolean).join(' ')}${h.profiles.role !== 'applicant' && h.profiles.role !== 'student' ? ` (${ROLE_LABEL[h.profiles.role as Role] ?? h.profiles.role})` : ''}` : ''}
                    </p>
                  </li>
                ))}
                <li className="relative border-l-2 border-line pl-4">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-line" aria-hidden />
                  <p className="font-semibold text-navy">Application started</p>
                  <p className="text-sm text-ink-muted">{formatDateTime(app.created_at)}</p>
                </li>
              </ol>
            </section>
            {app.emails && app.emails.length > 0 && (
              <section aria-labelledby="emails-h" className="mt-6 rounded-card border border-line bg-white p-5 shadow-card lg:mt-0">
                <h2 id="emails-h" className="text-h3 font-semibold text-navy">Emails to applicant</h2>
                <ul className="mt-3 divide-y divide-line">
                  {app.emails.map((e) => (
                    <li key={e.id} className="py-2.5">
                      <p className="text-base font-medium text-ink">{e.subject}</p>
                      <p className="text-sm text-ink-muted">
                        {formatDateTime(e.created_at)} ·{' '}
                        <span className={e.status === 'sent' ? 'text-success' : e.status === 'failed' ? 'text-crimson' : 'text-amber'}>
                          {e.status === 'sent' ? 'Sent' : e.status === 'failed' ? 'Failed to send' : e.status === 'skipped' ? 'Not sent (email not set up)' : 'Sending'}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
