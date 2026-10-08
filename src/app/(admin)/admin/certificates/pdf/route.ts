import { NextResponse, type NextRequest } from 'next/server'
import { after } from 'next/server'
import { requireStaff } from '@/lib/admin/session'
import { can } from '@/lib/admin/roles'
import { buildCertificatesPdf } from '@/lib/certificates/pdf'
import { listCohortCertificates, loadCertificates } from '@/lib/certificates/queries'
import { certificateFileName, printMode } from '@/lib/certificates/types'
import { notifyDirectorOfCertificates } from '@/lib/email/notify'
import { siteUrl } from '@/lib/site-url'

export const runtime = 'nodejs'
export const maxDuration = 60

const UUID = /^[0-9a-f-]{36}$/i

/**
 * Certificates for printing. ?cohort=<id> with either ?cert=<id> (one), ?only=new (not yet printed)
 * or nothing (every valid certificate). ?mode=full|qr. Every download is counted and logged.
 */
export async function GET(req: NextRequest) {
  const { supabase, staff } = await requireStaff(can.runClasses)
  const sp = req.nextUrl.searchParams
  const cohort = sp.get('cohort') ?? ''
  if (!UUID.test(cohort)) return new NextResponse('Not found', { status: 404 })
  const mode = printMode(sp.get('mode'))
  const all = (await listCohortCertificates(supabase, cohort)).filter((c) => !c.revoked_at)
  const one = sp.get('cert')
  const chosen = one ? all.filter((c) => c.id === one) : sp.get('only') === 'new' ? all.filter((c) => c.print_count === 0) : all
  if (!chosen.length) return new NextResponse('No certificates to print', { status: 404 })

  const { data: rec, error } = await supabase.rpc('staff_record_certificate_print', { p_certs: chosen.map((c) => c.id) })
  if (error) return new NextResponse('Not allowed', { status: 403 })
  const baseUrl = await siteUrl()
  const certs = await loadCertificates(chosen.map((c) => c.id))
  const pdf = await buildCertificatesPdf(certs, mode, baseUrl)

  if (staff.role !== 'director') {
    const reprints = (rec as { reprints: number } | null)?.reprints ?? 0
    const items = certs.map((c) => `${c.certificate_no}: ${c.holder_name}${chosen.find((x) => x.id === c.id)!.print_count > 0 ? ' (reprint)' : ''}`)
    after(() => notifyDirectorOfCertificates({ baseUrl }, { actor: staff.name, action: reprints ? 'Certificates reprinted' : 'Certificates printed', cohortId: cohort, items }))
  }
  const name = certs.length === 1 ? certificateFileName(certs[0].certificate_no, mode) : `IPCM-certificates-${mode === 'qr' ? 'number-and-QR' : 'full'}-${new Date().toISOString().slice(0, 10)}.pdf`
  return new NextResponse(Buffer.from(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store' },
  })
}
