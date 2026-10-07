import { ApplicantHelp } from '@/components/admin/ApplicantHelp'
import { PageHeader } from '@/components/admin/bits'
import { findPeople } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Applicant help' }

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase, staff } = await requireStaff(can.helpApplicants)
  const people = q ? await findPeople(supabase, q) : []
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Support" title="Applicant help" intro="Find an applicant who is stuck, fix a wrongly typed email or give them a new password. Every change is recorded with your name." />
      <ApplicantHelp q={q} people={people} canOpenApplications={can.review(staff.role)} />
    </div>
  )
}
