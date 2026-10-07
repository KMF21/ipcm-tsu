import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Clock, Hourglass, Inbox, Wallet } from 'lucide-react'
import { Alert, Card } from '@/components/ui'
import { AppStatusBadge, PageHeader, personName } from './bits'
import type { ApplicationRow, DashboardFigures, PaymentListRow } from '@/lib/admin/queries'
import { can, ROLE_LABEL, type Role } from '@/lib/admin/roles'
import { daysSince, daysUntil, lastPayDay } from '@/lib/admin/status'
import { FEE_LABEL, formatDateTime } from '@/lib/receipts/types'
import { formatNaira } from '@/lib/utils'

function Stat({ href, value, label, hint, Icon, tone }: { href?: string; value: string; label: string; hint?: string; Icon: typeof Inbox; tone: string }) {
  const body = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`} aria-hidden><Icon className="h-6 w-6" /></span>
      <p className="mt-4 font-display text-stat font-bold text-navy">{value}</p>
      <p className="mt-1 text-label font-semibold text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
    </>
  )
  const cls = 'block rounded-card border border-line bg-white p-5 shadow-card'
  return href ? <Link href={href} className={`${cls} transition hover:border-teal hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal`}>{body}</Link> : <div className={cls}>{body}</div>
}

export function AdminDashboard({
  name,
  role,
  figures,
  waiting,
  lapsing,
  payments,
  denied,
}: {
  name: string
  role: Role
  figures: DashboardFigures | null
  waiting: ApplicationRow[]
  lapsing: ApplicationRow[]
  payments: PaymentListRow[]
  denied?: boolean
}) {
  const f = figures
  const review = can.review(role)
  const money = can.money(role) && f?.received_kobo !== undefined
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={ROLE_LABEL[role]} title={`Welcome, ${name.split(' ')[0]}`} intro="Here is where admissions stand today." />
      {denied && <div className="mb-6"><Alert tone="warning" title="That page isn’t part of your role">Ask a super admin if you need access.</Alert></div>}

      {f && (
        <section aria-label="Admissions at a glance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat href={review ? '/admin/applications?tab=review' : undefined} value={String(f.new + f.under_review)} label="To review" hint={f.oldest_waiting ? `Oldest waiting ${daysSince(f.oldest_waiting)} days` : 'Nothing waiting'} Icon={Inbox} tone="bg-teal-50 text-teal" />
          <Stat href={review ? '/admin/applications?tab=waiting' : undefined} value={String(f.changes_requested)} label="Waiting for applicant" hint="Replacing documents" Icon={Hourglass} tone="bg-amber-50 text-amber" />
          <Stat href={review ? '/admin/applications?tab=offers' : undefined} value={String(f.offers_open)} label="Offers awaiting tuition" hint={f.offers_lapsed ? `${f.offers_lapsed} lapsed` : 'None lapsed'} Icon={Clock} tone="bg-navy-50 text-navy" />
          <Stat href={review ? '/admin/applications?tab=admitted' : undefined} value={String(f.admitted)} label="Admitted" hint={`${f.in_progress} still filling the form`} Icon={CheckCircle2} tone="bg-success-50 text-success" />
        </section>
      )}

      {money && (
        <section aria-label="Money received" className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Stat href="/admin/payments" value={formatNaira(f!.received_kobo!)} label="Total received" hint={`${f!.payments_count} payments`} Icon={Wallet} tone="bg-teal-50 text-teal" />
          <Stat href="/admin/payments?type=application" value={formatNaira(f!.received_application_kobo!)} label="Application fees" Icon={Wallet} tone="bg-canvas text-navy" />
          <Stat href="/admin/payments?type=tuition" value={formatNaira(f!.received_tuition_kobo!)} label="Tuition" Icon={Wallet} tone="bg-canvas text-navy" />
        </section>
      )}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        {review && (
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h3 font-semibold text-navy">Waiting longest</h2>
              <Link href="/admin/applications?tab=review" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">All <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            {waiting.length === 0 ? (
              <p className="rounded-xl bg-canvas p-4 text-base text-ink-muted">No applications are waiting for review.</p>
            ) : (
              <ul className="divide-y divide-line">
                {waiting.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/applications/${a.id}`} className="flex min-h-[64px] items-center gap-3 py-3 hover:bg-canvas sm:-mx-2 sm:rounded-xl sm:px-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-navy">{personName(a.profiles)}</span>
                        <span className="block text-sm text-ink-muted">{a.programmes?.code} · {a.ref}</span>
                      </span>
                      <span className="text-right">
                        <AppStatusBadge status={a.status} />
                        {a.submitted_at && <span className="mt-1 block text-sm text-ink-muted">{daysSince(a.submitted_at)} days</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {review && (
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h3 font-semibold text-navy">Offers ending soon</h2>
              <Link href="/admin/applications?tab=offers" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">All <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            {lapsing.length === 0 ? (
              <p className="rounded-xl bg-canvas p-4 text-base text-ink-muted">No offers end in the next 7 days.</p>
            ) : (
              <ul className="divide-y divide-line">
                {lapsing.map((a) => {
                  const d = a.offer_expires_at ? daysUntil(a.offer_expires_at) : 0
                  return (
                    <li key={a.id}>
                      <Link href={`/admin/applications/${a.id}`} className="flex min-h-[64px] items-center gap-3 py-3 hover:bg-canvas sm:-mx-2 sm:rounded-xl sm:px-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-navy">{personName(a.profiles)}</span>
                          <span className="block text-sm text-ink-muted">{a.programmes?.code} · pay by {a.offer_expires_at ? lastPayDay(a.offer_expires_at) : ''}</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold ${d <= 2 ? 'text-crimson' : 'text-amber'}`}>
                          <AlertTriangle className="h-4 w-4" aria-hidden /> {d <= 0 ? 'Last day' : `${d} days`}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )}

        {money && (
          <Card className={review ? 'lg:col-span-2' : ''}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h3 font-semibold text-navy">Latest payments</h2>
              <Link href="/admin/payments" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">All <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            {payments.length === 0 ? (
              <p className="rounded-xl bg-canvas p-4 text-base text-ink-muted">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/payments/${p.id}`} className="flex min-h-[64px] items-center gap-3 py-3 hover:bg-canvas sm:-mx-2 sm:rounded-xl sm:px-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-navy">{personName(p.profiles)}</span>
                        <span className="block text-sm text-ink-muted">{p.fee_items ? FEE_LABEL[p.fee_items.type] : ''} · {p.fee_items?.programmes?.code} · {p.paid_at ? formatDateTime(p.paid_at) : ''}</span>
                      </span>
                      <span className="whitespace-nowrap font-display font-bold text-navy">{formatNaira(p.amount_kobo)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {!review && !money && (
          <Card className="lg:col-span-2">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-6 w-6 shrink-0 text-teal" aria-hidden />
              <p className="text-base text-ink">Website editors can update the People and Research pages under Website. Teaching tools for facilitators arrive in the next phase.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
