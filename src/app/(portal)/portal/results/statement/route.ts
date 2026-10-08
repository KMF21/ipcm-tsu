import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMyEnrolment } from '@/lib/portal/queries'
import { statementPdfResponse } from '@/lib/certificates/respond'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login?next=/portal/results', req.url))
  const enrolment = await getMyEnrolment(supabase, user.id)
  if (!enrolment) return new NextResponse('Not found', { status: 404 })
  return statementPdfResponse(supabase, enrolment.id)
}
