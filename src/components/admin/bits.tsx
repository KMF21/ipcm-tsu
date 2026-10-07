import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { appStatus } from '@/lib/admin/status'
import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, intro, action }: { eyebrow?: string; title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-label font-semibold uppercase tracking-wide text-teal">{eyebrow}</p>}
        <h1 className="mt-1 text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-base text-ink-muted">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function AppStatusBadge({ status, offerExpiresAt }: { status: string; offerExpiresAt?: string | null }) {
  const s = appStatus(status, offerExpiresAt)
  return <Badge tone={s.tone}>{s.label}</Badge>
}

/** Builds a link that keeps the current filters and changes one. */
export function withParams(base: string, params: Record<string, string | undefined>, change: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...params, ...change })) if (v) u.set(k, v)
  const s = u.toString()
  return s ? `${base}?${s}` : base
}

export function Pagination({ base, params, page, count, size }: { base: string; params: Record<string, string | undefined>; page: number; count: number; size: number }) {
  const pages = Math.max(1, Math.ceil(count / size))
  if (pages <= 1) return null
  const link = 'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-white px-4 font-semibold text-navy hover:bg-canvas'
  return (
    <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pages">
      {page > 1 ? <Link className={link} href={withParams(base, params, { page: String(page - 1) })}><ChevronLeft className="h-5 w-5" aria-hidden /> Previous</Link> : <span />}
      <p className="text-sm text-ink-muted">Page {page} of {pages}</p>
      {page < pages ? <Link className={link} href={withParams(base, params, { page: String(page + 1) })}>Next <ChevronRight className="h-5 w-5" aria-hidden /></Link> : <span />}
    </nav>
  )
}

export function Tabs({ items, current }: { items: { key: string; label: string; href: string; count?: number }[]; current: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 border-b border-line">
        {items.map((t) => (
          <li key={t.key}>
            <Link
              href={t.href}
              aria-current={t.key === current ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex min-h-[48px] items-center gap-2 border-b-2 px-3 text-base font-semibold',
                t.key === current ? 'border-teal text-teal-700' : 'border-transparent text-ink-muted hover:text-navy',
              )}
            >
              {t.label}
              {typeof t.count === 'number' && t.count > 0 && <span className="rounded-full bg-teal-50 px-2 text-sm text-teal-700">{t.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function personName(p?: { title?: string | null; first_name: string | null; other_names?: string | null; surname: string | null; email?: string } | null) {
  if (!p) return 'Unknown'
  return [p.title, p.first_name, p.other_names, p.surname].filter(Boolean).join(' ') || p.email || 'Unknown'
}
