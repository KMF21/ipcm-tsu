import { NextResponse, type NextRequest } from 'next/server'
import { sendOfferReminders } from '@/lib/email/notify'
import { emailBaseUrl } from '@/lib/email/base'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Runs daily (vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
 * Reminds applicants 7 and 2 days before their offer ends, and once when it lapses.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const summary = await sendOfferReminders({ baseUrl: emailBaseUrl(request.nextUrl.origin) })
  return NextResponse.json({ ok: true, ...summary })
}
