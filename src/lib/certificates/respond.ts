import 'server-only'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { siteUrl } from '@/lib/site-url'
import { getStatement } from './queries'
import { buildStatementPdf } from './statement-pdf'

/** Statement of result PDF; get_statement decides who may see it. */
export async function statementPdfResponse(supabase: SupabaseClient, enrolmentId: string) {
  const s = await getStatement(supabase, enrolmentId)
  if (!s || !s.published_at) return new NextResponse('Statement of result not available', { status: 404 })
  const pdf = await buildStatementPdf(s, await siteUrl())
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="IPCM-Statement-of-Result-${s.reg_no.replace(/\//g, '-')}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
