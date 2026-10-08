import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AppStatusBadge, personName } from './bits'
import { HelpActions } from './HelpActions'
import type { PersonRow } from '@/lib/admin/queries'
import { formatDate } from '@/lib/utils'

export function ApplicantHelp({ q, people, canOpenApplications }: { q: string; people: PersonRow[]; canOpenApplications: boolean }) {
  return (
    <>
      <form method="get" action="/admin/help" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Find an applicant</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Name, email, phone or APP-…" className="pl-12" autoFocus />
        </label>
        <Button type="submit">Find</Button>
      </form>
      {q && <p className="mt-5 text-sm text-ink-muted" aria-live="polite">{people.length === 0 ? `No applicant matches “${q}”. Try part of their name or phone number.` : `${people.length} match${people.length === 1 ? '' : 'es'}`}</p>}
      <ul className="mt-3 space-y-4">
        {people.map((p) => (
          <li key={p.id} className="rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-navy">{personName(p)}</h2>
                <p className="break-all text-base text-ink">{p.email}</p>
                <p className="text-sm text-ink-muted">{p.phone ?? 'No phone yet'} · account created {formatDate(p.created_at)}</p>
              </div>
              <span className="text-sm font-semibold capitalize text-ink-muted">{p.role}</span>
            </div>
            {p.applications.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.applications.map((a) => (
                  <li key={a.id}>
                    {canOpenApplications ? (
                      <Link href={`/admin/applications/${a.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-navy hover:border-teal">
                        {a.ref} · {a.programmes?.code} <AppStatusBadge status={a.status} />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm">{a.ref} <AppStatusBadge status={a.status} /></span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4"><HelpActions userId={p.id} email={p.email} person={p} /></div>
          </li>
        ))}
      </ul>
    </>
  )
}
