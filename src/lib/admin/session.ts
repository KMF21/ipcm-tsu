import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isStaff } from '@/lib/auth/paths'
import type { Role } from './roles'

export type StaffUser = { id: string; name: string; email: string; role: Role }

/** The signed-in staff member, or a redirect. Cached per request (layout and page share it). */
export const getStaff = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data: p } = await supabase.from('profiles').select('first_name, surname, email, role, is_active').eq('id', user.id).single()
  if (!p || !p.is_active || !isStaff(p.role)) redirect('/portal')
  const staff: StaffUser = { id: user.id, name: [p.first_name, p.surname].filter(Boolean).join(' ') || p.email, email: p.email, role: p.role as Role }
  return { supabase, staff }
})

/** For pages limited to some roles: other staff go back to the dashboard. */
export async function requireStaff(allowed?: (role: Role) => boolean) {
  const ctx = await getStaff()
  if (allowed && !allowed(ctx.staff.role)) redirect('/admin?denied=1')
  return ctx
}
