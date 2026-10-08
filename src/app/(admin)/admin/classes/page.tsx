import Link from 'next/link'
import { CalendarDays, ChevronRight, Users } from 'lucide-react'
import { Badge, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/admin/bits'
import { listClasses } from '@/lib/admin/classes'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Classes' }

export default async function ClassesPage() {
  const { supabase, staff } = await requireStaff(can.classes)
  const classes = await listClasses(supabase, staff)
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Teaching" title="Classes" intro={can.runClasses(staff.role) ? 'Each intake with admitted students. Set up the class, enter scores and publish results.' : 'The classes you are assigned to. Mark attendance, enter scores and post announcements.'} />
      {classes.length === 0 ? (
        <EmptyState illustration title="No classes yet" body={can.runClasses(staff.role) ? 'Classes appear here once students are admitted to an intake.' : 'Ask the Director to assign you to a class.'} />
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/classes/${c.id}`} className="flex items-center gap-4 rounded-card border border-line bg-white p-5 shadow-card hover:border-teal">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-teal">{c.programmes?.code} · {c.programmes?.short_title}</p>
                  <h2 className="text-lg font-semibold text-navy">{c.name}</h2>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden />{formatDate(c.start_date)} – {formatDate(c.end_date)}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />{c.students} student{c.students === 1 ? '' : 's'}</span>
                    <span>{c.sessions ? `${c.sessions} sessions` : 'No timetable yet'}</span>
                  </p>
                </div>
                {c.published > 0 ? <Badge tone="success">Results published</Badge> : <Badge tone="neutral">In progress</Badge>}
                <ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
