import type { NextRequest } from 'next/server'
import { letterPdfResponse } from '@/lib/letters/respond'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return letterPdfResponse(req, id, '/portal/apply')
}
