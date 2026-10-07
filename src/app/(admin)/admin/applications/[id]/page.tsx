import { notFound } from 'next/navigation'
import { ApplicationReview } from '@/components/admin/ApplicationReview'
import type { ReviewDoc } from '@/components/admin/DocumentReview'
import type { DecisionInfo } from '@/components/admin/DecisionPanel'
import { getApplicationDetail } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { daysUntil, isLapsed, lastPayDay } from '@/lib/admin/status'
import { DOC_RULES, formatBytes, type DocType } from '@/lib/application/steps'

export const metadata = { title: 'Review application' }

const ORDER: DocType[] = ['passport_photo', 'qualification', 'identification', 'cv', 'sponsorship_letter']
const lagosDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireStaff(can.review)
  const detail = await getApplicationDetail(supabase, id)
  if (!detail) notFound()
  const { app, links } = detail

  const docs: ReviewDoc[] = [...app.documents]
    .sort((a, b) => ORDER.indexOf(a.type as DocType) - ORDER.indexOf(b.type as DocType))
    .map((d, i, all) => {
      const same = all.filter((x) => x.type === d.type)
      const n = same.length > 1 ? ` (${same.indexOf(d) + 1} of ${same.length})` : ''
      return { id: d.id, label: (DOC_RULES[d.type as DocType]?.label ?? d.type) + n, mime: d.mime, size: formatBytes(d.size_bytes), status: d.status, rejection_reason: d.rejection_reason, url: links[d.storage_path] }
    })
  const photo = app.documents.find((d) => d.type === 'passport_photo')

  const [{ data: seats }, { data: enrolment }] = await Promise.all([
    supabase.rpc('staff_intake_seats'),
    app.status === 'admitted' ? supabase.from('enrolments').select('reg_no').eq('application_id', app.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const mySeats = (seats as { cohort_id: string; seats_taken: number }[] | null)?.find((s) => s.cohort_id === app.cohorts?.id)

  const expires = app.offer_expires_at
  const now = new Date()
  const extendBase = expires && new Date(expires) > now ? new Date(new Date(expires).getTime() - 1000) : now
  const withdrawn = app.application_status_history.find((h) => h.to_status === 'withdrawn')
  const decision: DecisionInfo = {
    id: app.id,
    status: app.status,
    offerDays: app.cohorts?.offer_expiry_days ?? 30,
    docs: {
      total: docs.length,
      approved: docs.filter((d) => d.status === 'approved').length,
      pending: docs.filter((d) => d.status === 'pending').length,
      rejected: docs.filter((d) => d.status === 'rejected').length,
    },
    rejectedLabels: docs.filter((d) => d.status === 'rejected').map((d) => d.label),
    payBy: expires ? lastPayDay(expires) : undefined,
    daysLeft: expires ? Math.max(0, daysUntil(expires)) : undefined,
    lapsed: isLapsed(app.status, expires),
    extendDefault: lagosDate(new Date(extendBase.getTime() + 14 * 86_400_000)),
    today: lagosDate(now),
    decisionReason: app.status === 'declined' ? app.decision_reason : withdrawn?.note,
    regNo: (enrolment as { reg_no?: string } | null)?.reg_no ?? null,
    seats: app.cohorts && mySeats ? { taken: mySeats.seats_taken, capacity: app.cohorts.capacity } : undefined,
  }

  return <ApplicationReview app={app} docs={docs} decision={decision} photoUrl={photo ? links[photo.storage_path] : undefined} />
}
