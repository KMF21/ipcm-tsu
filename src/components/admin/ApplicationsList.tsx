import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { AppStatusBadge, Pagination, Tabs, personName, withParams } from './bits'
import type { ApplicationRow } from '@/lib/admin/queries'
import { LIST_TABS, daysSince, daysUntil, isLapsed, lastPayDay } from '@/lib/admin/status'
import { formatDate } from '@/lib/utils'

function When({ a }: { a: ApplicationRow }) {
  if (a.status === 'offered' && a.offer_expires_at) {
    if (isLapsed(a.status, a.offer_expires_at)) return <span className="text-crimson">Lapsed {lastPayDay(a.offer_expires_at)}</span>
    const d = daysUntil(a.offer_expires_at)
    return <span className={d <= 7 ? 'font-semibold text-amber' : ''}>Pay by {lastPayDay(a.offer_expires_at)}</span>
  }
  if ((a.status === 'submitted' || a.status === 'under_review') && a.submitted_at) {
    const d = daysSince(a.submitted_at)
    return <span className={d >= 7 ? 'font-semibold text-amber' : ''}>Waiting {d === 0 ? 'since today' : `${d} day${d === 1 ? '' : 's'}`}</span>
  }
  if (a.status === 'draft') return <span>{a.application_fee_paid_at ? 'Fee paid, filling form' : 'Not paid yet'}</span>
  return <span>Updated {formatDate(a.updated_at)}</span>
}

export function ApplicationsList({
  rows, count, page, size, tab, params, programmes, cohorts,
}: {
  rows: ApplicationRow[]
  count: number
  page: number
  size: number
  tab: string
  params: Record<string, string | undefined>
  programmes: { code: string; short_title: string }[]
  cohorts: { id: string; name: string; programmes: { code: string } | null }[]
}) {
  const base = '/admin/applications'
  return (
    <>
      <Tabs current={tab} items={LIST_TABS.map((t) => ({ key: t.key, label: t.label, href: withParams(base, params, { tab: t.key, page: undefined }) }))} />

      <form method="get" action={base} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_220px_auto]" role="search">
        <input type="hidden" name="tab" value={tab} />
        <label className="relative">
          <span className="sr-only">Search by name, email, phone or application number</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input name="q" defaultValue={params.q} placeholder="Name, email, phone or APP-…" className="pl-12" />
        </label>
        <label>
          <span className="sr-only">Programme</span>
          <Select name="programme" defaultValue={params.programme ?? ''}>
            <option value="">All programmes</option>
            {programmes.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.short_title}</option>)}
          </Select>
        </label>
        <label>
          <span className="sr-only">Intake</span>
          <Select name="cohort" defaultValue={params.cohort ?? ''}>
            <option value="">All intakes</option>
            {cohorts.map((c) => <option key={c.id} value={c.id}>{c.programmes?.code} · {c.name}</option>)}
          </Select>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <p className="mt-5 text-sm text-ink-muted" aria-live="polite">{count === 0 ? 'No applications match.' : `${count} application${count === 1 ? '' : 's'}`}{params.q ? ` for “${params.q}”` : ''}</p>

      {rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="mt-3 hidden overflow-hidden rounded-card border border-line bg-white shadow-card lg:block">
            <table className="w-full text-left text-base">
              <thead className="bg-canvas text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Applicant</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Programme</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Timing</th>
                  <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => (
                  <tr key={a.id} className="group relative hover:bg-canvas">
                    <td className="px-5 py-4">
                      <Link href={`/admin/applications/${a.id}`} className="font-semibold text-navy after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline">{personName(a.profiles)}</Link>
                      <p className="text-sm text-ink-muted">{a.ref} · {a.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-4"><span className="font-semibold">{a.programmes?.code}</span><p className="text-sm text-ink-muted">{a.cohorts?.name}</p></td>
                    <td className="px-4 py-4"><AppStatusBadge status={a.status} offerExpiresAt={a.offer_expires_at} /></td>
                    <td className="px-4 py-4 text-sm text-ink-muted"><When a={a} /></td>
                    <td className="px-4 py-4"><ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone and tablet cards */}
          <ul className="mt-3 space-y-3 lg:hidden">
            {rows.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="block rounded-card border border-line bg-white p-4 shadow-card hover:border-teal">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{personName(a.profiles)}</p>
                      <p className="text-sm text-ink-muted">{a.programmes?.code} · {a.ref}</p>
                    </div>
                    <AppStatusBadge status={a.status} offerExpiresAt={a.offer_expires_at} />
                  </div>
                  <p className="mt-2 text-sm text-ink-muted"><When a={a} /></p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Pagination base={base} params={params} page={page} count={count} size={size} />
    </>
  )
}
