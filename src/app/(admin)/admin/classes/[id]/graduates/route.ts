import { NextResponse, type NextRequest } from 'next/server'
import { requireStaff } from '@/lib/admin/session'
import { can } from '@/lib/admin/roles'
import { getClass } from '@/lib/admin/classes'
import { listCohortCertificates } from '@/lib/certificates/queries'
import { csvResponse, toCsv } from '@/lib/admin/csv'

/** Everyone in the intake with their result and certificate, for the Institute's records. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireStaff(can.runClasses)
  const k = await getClass(supabase, id)
  if (!k) return new NextResponse('Not found', { status: 404 })
  const certs = (await listCohortCertificates(supabase, id)).filter((c) => !c.revoked_at)
  const d = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')
  const rows = k.students.map((s) => {
    const r = k.results.find((x) => x.enrolment_id === s.id)
    const c = certs.find((x) => x.enrolment_id === s.id)
    return [s.reg_no, s.name, s.email, s.phone, r?.total_pct ?? '', r?.published_at ? r.classification : 'Not published', c?.certificate_no, d(c?.issued_at), c?.print_count ?? '', d(c?.collected_at), c?.collected_by]
  })
  return csvResponse(`ipcm-graduates-${k.cohort.programmes?.code ?? ''}`.toLowerCase(), toCsv(
    ['Registration number', 'Name', 'Email', 'Phone', 'Overall %', 'Result', 'Certificate number', 'Issued', 'Times printed', 'Collected', 'Collected by'],
    rows,
  ))
}
