import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button, ButtonLink, EmptyState } from '@/components/ui'
import { signOut } from '@/lib/auth/actions'
import { isStaff } from '@/lib/auth/paths'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function AdminHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data: profile } = await supabase.from('profiles').select('first_name, role').eq('id', user.id).single()
  if (!isStaff(profile?.role)) redirect('/portal')
  return (
    <main id="main" className="container-page py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.875rem] font-bold leading-[2.375rem] sm:text-h1">Welcome, {profile?.first_name ?? 'admin'}</h1>
          <p className="mt-2 text-lead text-ink-muted">Signed in as {String(profile?.role).replace('_', ' ')}.</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto">
            <LogOut className="h-5 w-5" aria-hidden /> Sign out
          </Button>
        </form>
      </div>
      <div className="mt-10">
        <EmptyState illustration title="The admin portal is on the way" body="Application review, offers, cohorts and fees arrive later in Phase 1." action={<ButtonLink href="/">View the website</ButtonLink>} />
      </div>
    </main>
  )
}
