import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { homeForRole, isStaff } from '@/lib/auth/paths'

/**
 * Refreshes the Supabase session and guards /portal and /admin by role.
 * While NEXT_PUBLIC_PORTAL_PREVIEW=true (Phase 0 design review) the portal is open with demo data.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPortal = pathname.startsWith('/portal')
  const isAdmin = pathname.startsWith('/admin')
  const isAuthPage = /^\/(login|register|forgot-password)(\/|$)/.test(pathname)
  if (process.env.NEXT_PUBLIC_PORTAL_PREVIEW === 'true' && isPortal) return NextResponse.next()
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return isPortal || isAdmin ? NextResponse.redirect(new URL('/login', request.url)) : NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()

  if ((isPortal || isAdmin) && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  if (user && (isAdmin || isAuthPage)) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    // Signed-in users don't need the login or register pages.
    if (isAuthPage) return NextResponse.redirect(new URL(homeForRole(data?.role), request.url))
    if (!isStaff(data?.role)) return NextResponse.redirect(new URL('/portal', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|placeholders|tsu-logo.png|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)'],
}
