type Tone = 'teal' | 'navy' | 'amber' | 'crimson' | 'success' | 'neutral'

export function isLapsed(status: string, offerExpiresAt?: string | null) {
  return status === 'offered' && !!offerExpiresAt && new Date(offerExpiresAt).getTime() <= Date.now()
}

/** Staff-facing label for an application's state. A lapsed offer is still "offered" in the database. */
export function appStatus(status: string, offerExpiresAt?: string | null): { label: string; tone: Tone } {
  if (isLapsed(status, offerExpiresAt)) return { label: 'Offer lapsed', tone: 'crimson' }
  const map: Record<string, { label: string; tone: Tone }> = {
    draft: { label: 'Not submitted', tone: 'neutral' },
    submitted: { label: 'New', tone: 'teal' },
    under_review: { label: 'Under review', tone: 'amber' },
    changes_requested: { label: 'Waiting for applicant', tone: 'amber' },
    offered: { label: 'Offer made', tone: 'navy' },
    admitted: { label: 'Admitted', tone: 'success' },
    declined: { label: 'Declined', tone: 'crimson' },
    withdrawn: { label: 'Withdrawn', tone: 'neutral' },
    offer_expired: { label: 'Offer lapsed', tone: 'crimson' },
  }
  return map[status] ?? { label: status, tone: 'neutral' }
}

/** Whole days from now until a date (negative when past), counted in Nigerian calendar days. */
export function daysUntil(iso: string) {
  const day = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })).getTime()
  // offer_expires_at is midnight at the END of the last day, so step back one second to land on that day.
  return Math.round((day(new Date(new Date(iso).getTime() - 1000)) - day(new Date())) / 86_400_000)
}

export function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

/** The last day an offer can be paid, e.g. "6 November 2026". */
export function lastPayDay(iso: string) {
  return new Date(new Date(iso).getTime() - 1000).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'long', year: 'numeric' })
}

export const LIST_TABS = [
  { key: 'review', label: 'To review', statuses: ['submitted', 'under_review'] },
  { key: 'waiting', label: 'Waiting for applicant', statuses: ['changes_requested'] },
  { key: 'offers', label: 'Offers', statuses: ['offered'] },
  { key: 'admitted', label: 'Admitted', statuses: ['admitted'] },
  { key: 'closed', label: 'Declined or withdrawn', statuses: ['declined', 'withdrawn', 'offer_expired'] },
  { key: 'drafts', label: 'Not submitted', statuses: ['draft'] },
  { key: 'all', label: 'All', statuses: [] as string[] },
] as const
export type ListTab = (typeof LIST_TABS)[number]['key']
