import type { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/admin/session'
import { can } from '@/lib/admin/roles'
import { statementPdfResponse } from '@/lib/certificates/respond'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: Promise<{ enrolment: string }> }) {
  const { supabase } = await requireStaff(can.runClasses)
  return statementPdfResponse(supabase, (await params).enrolment)
}
