import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site-url'
import { getAdmissionLetter } from './queries'
import { buildAdmissionLetterPdf } from './pdf'
import { letterVerifyPath } from './types'

export const letterFileName = (regNo: string) => `IPCM-Admission-Letter-${regNo.replace(/\//g, '-')}.pdf`

/** The admitted student or staff (the database decides) download the admission letter. */
export async function letterPdfResponse(req: NextRequest, applicationId: string, loginNext: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(loginNext)}`, req.url))
  const letter = await getAdmissionLetter(supabase, applicationId)
  if (!letter) return new NextResponse('Admission letter not found', { status: 404 })
  const pdf = await buildAdmissionLetterPdf(letter, `${await siteUrl()}${letterVerifyPath(letter.letter_token)}`)
  const inline = req.nextUrl.searchParams.get('view') === '1'
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${letterFileName(letter.reg_no)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
