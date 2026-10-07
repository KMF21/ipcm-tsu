import { Clock, FileCheck2 } from 'lucide-react'
import { Alert, Badge, ButtonLink, Card, Stepper } from '@/components/ui'
import type { MyApplication } from '@/lib/application/queries'
import { formatDate } from '@/lib/utils'
import { daysUntil, isLapsed, lastPayDay } from '@/lib/admin/status'
import { site } from '@/lib/site'

const JOURNEY = ['Apply', 'Submitted', 'Review', 'Offer', 'Pay tuition', 'Admitted']
const position: Record<string, number> = { draft: 0, submitted: 1, under_review: 2, changes_requested: 2, offered: 3, admitted: 5 }

const copy: Record<string, { title: string; body: string; tone: 'info' | 'success' | 'warning' | 'error' }> = {
  submitted: { title: 'Application received', body: 'Thank you. The admissions team will review your application and documents. We’ll let you know by email and here in your portal.', tone: 'success' },
  under_review: { title: 'Under review', body: 'The admissions team is reviewing your application. Most reviews take a few working days.', tone: 'info' },
  changes_requested: { title: 'Action needed', body: 'One or more documents need replacing. Open your documents, remove the rejected file and upload a new one.', tone: 'warning' },
  offered: { title: 'You have an offer of admission', body: 'Congratulations. Pay your tuition before the offer expires to secure your seat.', tone: 'success' },
  admitted: { title: 'You’re admitted', body: 'Welcome to IPCM. Your registration number is in your portal.', tone: 'success' },
  declined: { title: 'Application not successful', body: 'Thank you for applying. Unfortunately we could not offer you a place in this intake. You are welcome to apply again.', tone: 'error' },
  offer_expired: { title: 'Offer expired', body: 'Your offer was not accepted in time. Contact the admissions office if you still wish to join.', tone: 'error' },
  withdrawn: { title: 'Application withdrawn', body: 'This application was withdrawn.', tone: 'info' },
}

export function ApplicationStatus({ app }: { app: MyApplication }) {
  const lapsed = isLapsed(app.status, app.offer_expires_at)
  const left = app.offer_expires_at ? daysUntil(app.offer_expires_at) : null
  let c = copy[app.status] ?? copy.submitted
  if (app.status === 'offered' && app.offer_expires_at) {
    c = lapsed
      ? { title: 'Your offer has expired', body: `Tuition wasn’t paid by ${lastPayDay(app.offer_expires_at)}. If you still want to join, contact the admissions office at ${site.admissionsEmail.value} as soon as possible.`, tone: 'error' }
      : { ...copy.offered, body: `Congratulations. Pay your tuition by ${lastPayDay(app.offer_expires_at)} to secure your seat (${left === 0 ? 'today is the last day' : `${left} day${left === 1 ? '' : 's'} left`}). After that date the offer lapses and your seat may go to someone else.` }
  }
  if (app.status === 'declined' && app.decision_reason) c = { ...copy.declined, body: `${copy.declined.body} Reason: ${app.decision_reason}` }
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Your application</p>
        <Badge tone="navy">{app.ref}</Badge>
      </div>
      <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">{app.programmes?.short_title}</h1>
      {app.cohorts && <p className="mt-2 text-base text-ink-muted">{app.cohorts.name} · starts {formatDate(app.cohorts.start_date)}</p>}
      <Card className="mt-6 space-y-6">
        <Stepper steps={JOURNEY} current={position[app.status] ?? 1} />
        <Alert tone={c.tone} title={c.title}>{c.body}</Alert>
        {app.status === 'changes_requested' && <ButtonLink href="/portal/apply/documents" size="lg">Fix my documents</ButtonLink>}
        {app.status === 'offered' && !lapsed && <ButtonLink href="/portal/apply/pay" size="lg">Pay tuition</ButtonLink>}
        <ButtonLink href="/portal/payments" variant="secondary" size="lg">View my receipts</ButtonLink>
        <div className="flex items-start gap-3 rounded-card bg-canvas p-4 text-base text-ink">
          {app.status === 'submitted' || app.status === 'under_review' ? <Clock className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden /> : <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />}
          <p>Keep your application reference <strong className="text-navy">{app.ref}</strong> for any enquiries.</p>
        </div>
      </Card>
    </div>
  )
}
