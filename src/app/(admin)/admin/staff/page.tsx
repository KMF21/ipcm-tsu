import { PageHeader } from '@/components/admin/bits'
import { AddStaffForm, RoleGuide, StaffRowForm, type StaffRow } from '@/components/admin/StaffManager'
import { Card } from '@/components/ui'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Staff accounts' }

export default async function StaffPage() {
  const { supabase, staff } = await requireStaff(can.manageStaff)
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, surname, email, role, is_active, created_at')
    .in('role', ['facilitator', 'editor', 'bursary', 'admissions', 'director', 'super_admin'])
    .order('role')
    .order('surname')
  const rows: StaffRow[] = (data ?? []).map((p) => ({ id: p.id, name: [p.first_name, p.surname].filter(Boolean).join(' ') || p.email, email: p.email, role: p.role, is_active: p.is_active, created_at: p.created_at }))
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Super admin" title="Staff accounts" intro="Add staff, change what they can do, or switch off an account when someone leaves. Every change is recorded." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card><h2 className="mb-4 text-h3 font-semibold">Add a staff member</h2><AddStaffForm /></Card>
        <Card><h2 className="mb-4 text-h3 font-semibold">What each role can do</h2><RoleGuide /></Card>
      </div>
      <h2 className="mt-8 text-h3 font-semibold">{rows.length} staff account{rows.length === 1 ? '' : 's'}</h2>
      <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-white shadow-card">
        {rows.map((r) => <StaffRowForm key={r.id} s={r} self={r.id === staff.id} />)}
      </ul>
    </div>
  )
}
