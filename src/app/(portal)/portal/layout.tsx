import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PortalShell, type PortalUser } from '@/components/portal/PortalShell'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Student portal', robots: { index: false, follow: false } }

async function currentUser(): Promise<PortalUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const [{ data: profile }, { data: enrolment }, { data: application }] = await Promise.all([
    supabase.from('profiles').select('first_name, surname').eq('id', user.id).single(),
    supabase.from('enrolments').select('reg_no').eq('user_id', user.id).order('admitted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('applications').select('ref, programmes(code)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const name = [profile?.first_name, profile?.surname].filter(Boolean).join(' ') || user.email || 'Applicant'
  const programme = (application?.programmes as { code?: string } | null)?.code ?? ''
  return { name, regNo: enrolment?.reg_no ?? application?.ref ?? 'No application yet', programmeCode: programme }
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/login?next=/portal')
  return <PortalShell user={user}>{children}</PortalShell>
}
