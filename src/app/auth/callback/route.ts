import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { homeForRole, safeNext } from '@/lib/auth/paths'

/**
 * Landing point for links in Supabase emails (confirm sign-up, reset password).
 * Exchanges the one-time code for a session, then sends the user on.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const rawNext = url.searchParams.get('next')
  const origin = url.origin

  if (!code) return NextResponse.redirect(`${origin}/login?error=link`)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=link`)

  if (rawNext === '/reset-password') return NextResponse.redirect(`${origin}/reset-password`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
  const dest = rawNext ? safeNext(rawNext, homeForRole(profile?.role)) : homeForRole(profile?.role)
  return NextResponse.redirect(`${origin}${dest}${dest.includes('?') ? '&' : '?'}welcome=1`)
}
