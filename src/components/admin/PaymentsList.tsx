import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { Badge, Button, Input, Select } from '@/components/ui'
import { Pagination, Tabs, personName, withParams } from './bits'
import type { PaymentListRow } from '@/lib/admin/queries'
import { FEE_LABEL, formatDateTime } from '@/lib/receipts/types'
import { formatNaira } from '@/lib/utils'

const STATUS = [
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Started, not finished' },
  { key: 'failed', label: 'Failed' },
  { key: 'all', label: 'All' },
]
const tone = { paid: 'success', pending: 'amber', failed: 'crimson', abandoned: 'neutral', refunded: 'navy' } as const

export function PaymentsList({ rows, count, page, size, params }: { rows: PaymentListRow[]; count: number; page: number; size: number; params: Record<string, string | undefined> }) {
  const base = '/admin/payments'
  const status = params.status ?? 'paid'
  return (
    <>
      <Tabs current={status} items={STATUS.map((s) => ({ key: s.key, label: s.label, href: withParams(base, params, { status: s.key === 'paid' ? undefined : s.key, page: undefined }) }))} />
      <form method="get" action={base} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]" role="search">
        {params.status && <input type="hidden" name="status" value={params.status} />}
        <label className="relative">
          <span className="sr-only">Search by name, email, receipt or reference</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input name="q" defaultValue={params.q} placeholder="Name, email, RCT-… or IPCM-…" className="pl-12" />
        </label>
        <label>
          <span className="sr-only">Fee</span>
          <Select name="type" defaultValue={params.type ?? ''}>
            <option value="">All fees</option>
            <option value="application">Application fee</option>
            <option value="tuition">Tuition</option>
          </Select>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <p className="mt-5 text-sm text-ink-muted" aria-live="polite">{count === 0 ? 'No payments match.' : `${count} payment${count === 1 ? '' : 's'}`}</p>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
        {rows.map((p) => {
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-navy">{personName(p.profiles)}</span>
                <span className="block text-sm text-ink-muted">
                  {p.fee_items ? FEE_LABEL[p.fee_items.type] : ''} · {p.fee_items?.programmes?.code}
                  {p.applications ? ` · ${p.applications.ref}` : ''}
                </span>
                <span className="block text-sm text-ink-muted">{p.receipt_no ?? p.reference} · {formatDateTime(p.paid_at ?? p.created_at)}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="whitespace-nowrap font-display text-lg font-bold text-navy">{formatNaira(p.amount_kobo)}</span>
                {p.status !== 'paid' && <Badge tone={tone[p.status as keyof typeof tone] ?? 'neutral'}>{p.status === 'pending' ? 'Not finished' : p.status}</Badge>}
              </span>
              {p.status === 'paid' && <ChevronRight className="hidden h-5 w-5 shrink-0 text-ink-muted sm:block" aria-hidden />}
            </>
          )
          return (
            <li key={p.id}>
              {p.status === 'paid' ? (
                <Link href={`/admin/payments/${p.id}`} className="flex min-h-[72px] items-center gap-3 px-4 py-3 hover:bg-canvas sm:px-5">{body}</Link>
              ) : (
                <div className="flex min-h-[72px] items-center gap-3 px-4 py-3 sm:px-5">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
      <Pagination base={base} params={params} page={page} count={count} size={size} />
    </>
  )
}
