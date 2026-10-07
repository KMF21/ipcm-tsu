import { AdminDashboard } from '@/components/admin/Dashboard'
import { getDashboard, listApplications, listPayments, type ApplicationRow } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { getStaff } from '@/lib/admin/session'

export const metadata = { title: 'Dashboard' }

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams
  const { supabase, staff } = await getStaff()
  const review = can.review(staff.role)
  const money = can.money(staff.role)
  const soon = new Date(Date.now() + 7 * 86_400_000).toISOString()
  const [figures, waiting, lapsing, payments] = await Promise.all([
    getDashboard(supabase),
    review ? listApplications(supabase, { tab: 'review' }).then((r) => r.rows.slice(0, 5)) : Promise.resolve([]),
    review
      ? supabase
          .from('applications')
          .select('id, ref, status, submitted_at, created_at, updated_at, offer_expires_at, application_fee_paid_at, programmes(code, short_title), cohorts(name), profiles(first_name, surname, email, phone)')
          .eq('status', 'offered')
          .gt('offer_expires_at', new Date().toISOString())
          .lte('offer_expires_at', soon)
          .order('offer_expires_at')
          .limit(5)
          .then((r) => (r.data ?? []) as unknown as ApplicationRow[])
      : Promise.resolve([]),
    money ? listPayments(supabase, {}).then((r) => r.rows.slice(0, 5)) : Promise.resolve([]),
  ])
  return <AdminDashboard name={staff.name} role={staff.role} figures={figures} waiting={waiting} lapsing={lapsing} payments={payments} denied={!!sp.denied} />
}
