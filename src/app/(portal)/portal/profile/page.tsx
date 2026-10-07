import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { ContactDetailsForm, PasswordForm } from '@/components/portal/ProfileForms'
import { createClient } from '@/lib/supabase/server'
import { getMyEnrolment } from '@/lib/portal/queries'
import { getMyApplication } from '@/lib/application/queries'
import { site } from '@/lib/site'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/profile')
  const [{ data: p }, enrolment, app] = await Promise.all([
    supabase.from('profiles').select('title, first_name, other_names, surname, email, phone, address, sex, dob, created_at').eq('id', user.id).single(),
    getMyEnrolment(supabase, user.id),
    getMyApplication(supabase, user.id),
  ])
  const name = [p?.title, p?.first_name, p?.other_names, p?.surname].filter(Boolean).join(' ')
  const rows: [string, string | null | undefined][] = [
    ['Full name', name],
    ['Email', p?.email],
    ['Registration number', enrolment?.reg_no],
    ['Application number', app?.ref],
    ['Date of birth', p?.dob ? formatDate(p.dob) : null],
    ['Account created', p?.created_at ? formatDate(p.created_at) : null],
  ]
  return (
    <div className="mx-auto max-w-4xl">
      <PortalHeader title="Profile" intro="Keep your phone number and address up to date so we can reach you." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <h2 className="text-h3 font-semibold">Your details</h2>
          <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="border-b border-line py-3"><dt className="text-sm text-ink-muted">{k}</dt><dd className="break-words text-base font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-ink-muted">Need to correct your name or email? These appear on your letters and certificate, so the admissions office changes them for you: <a className="font-semibold text-teal" href={`mailto:${site.admissionsEmail.value}`}>{site.admissionsEmail.value}</a>.</p>
        </Card>
        <Card>
          <h2 className="text-h3 font-semibold">Contact details</h2>
          <div className="mt-4"><ContactDetailsForm phone={p?.phone ?? ''} address={p?.address ?? ''} /></div>
        </Card>
        <Card>
          <h2 className="text-h3 font-semibold">Change password</h2>
          <div className="mt-4"><PasswordForm /></div>
        </Card>
      </div>
    </div>
  )
}
