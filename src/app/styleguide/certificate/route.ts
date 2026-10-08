import { NextResponse, type NextRequest } from 'next/server'
import { buildCertificatesPdf } from '@/lib/certificates/pdf'
import { buildStatementPdf } from '@/lib/certificates/statement-pdf'
import type { Certificate, Statement } from '@/lib/certificates/types'
import { programmes } from '@/lib/programmes'
import { siteUrl } from '@/lib/site-url'

/** Design preview with made-up data. Only available outside production or in preview mode. */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_PORTAL_PREVIEW !== 'true') return new NextResponse('Not found', { status: 404 })
  const kind = req.nextUrl.searchParams.get('kind') ?? 'full'
  const base = await siteUrl()
  const p = programmes[0]
  const cert: Certificate = {
    id: 'x', certificate_no: 'IPCM-PCM-2027-0042', verify_token: '0'.repeat(32), issued_at: new Date().toISOString(),
    holder_name: 'Halima Nafisatu Danjuma-Abubakar', programme_title: p.title, cohort_name: 'PCM – February 2027',
    classification: 'Distinction', revoked: false, reg_no: 'TSU/IPCM/PCM/2027/0042', programme_code: p.code, end_date: '2027-04-10',
  }
  let pdf: Uint8Array
  if (kind === 'statement') {
    const s: Statement = {
      enrolment_id: 'x', reg_no: cert.reg_no, name: cert.holder_name, programme_code: p.code, programme_title: p.title, cohort_name: cert.cohort_name,
      start_date: '2027-02-13', end_date: '2027-04-10', attendance_mode: 'required', attendance_waived: false, attendance_pct: 87.5, total_pct: 76.3,
      classification: 'Distinction', published_at: new Date().toISOString(), modules: p.modules.map((m, i) => ({ number: m.number, title: m.title, score: 68 + i * 4 })),
      capstone: 78, certificate_no: cert.certificate_no, certificate_token: cert.verify_token,
    }
    pdf = await buildStatementPdf(s, base)
  } else pdf = await buildCertificatesPdf([cert, { ...cert, holder_name: 'Musa Ali', classification: 'Pass', certificate_no: 'IPCM-PCM-2027-0043' }], kind === 'qr' ? 'qr' : 'full', base)
  return new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' } })
}
