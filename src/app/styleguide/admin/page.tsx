import { AdminShell } from '@/components/admin/AdminShell'
import { AdminDashboard } from '@/components/admin/Dashboard'
import { ApplicationsList } from '@/components/admin/ApplicationsList'
import { ApplicationReview } from '@/components/admin/ApplicationReview'
import { Intakes } from '@/components/admin/Intakes'
import { Fees } from '@/components/admin/Fees'
import { PaymentsList } from '@/components/admin/PaymentsList'
import { ApplicantHelp } from '@/components/admin/ApplicantHelp'
import { PageHeader, Tabs } from '@/components/admin/bits'
import { AddStaffForm, RoleGuide, StaffRowForm } from '@/components/admin/StaffManager'
import { AddPanel, PeopleList, PersonForm } from '@/components/admin/WebsiteEditor'
import { RecordPaymentForm } from '@/components/admin/RecordPaymentForm'
import { Card } from '@/components/ui'
import type { ReviewDoc } from '@/components/admin/DocumentReview'
import type { DecisionInfo } from '@/components/admin/DecisionPanel'
import type { ApplicationDetail, ApplicationRow, CohortRow, FeeRow, PaymentListRow, PersonRow } from '@/lib/admin/queries'
import type { Role } from '@/lib/admin/roles'
import { programmes } from '@/lib/programmes'

export const metadata = { title: 'Admin preview', robots: { index: false, follow: false } }

const day = 86_400_000
const ago = (d: number) => new Date(Date.now() - d * day).toISOString()
const ahead = (d: number) => new Date(Date.now() + d * day).toISOString()
const people = [
  ['Amina', 'Bello', 'amina.bello@example.com'], ['Tersoo', 'Akaa', 'tersoo.a@example.com'], ['Halima', 'Danjuma', 'halima.d@example.com'],
  ['Emmanuel', 'Agbu', 'e.agbu@example.com'], ['Grace', 'Nyako', 'grace.nyako@example.com'], ['Ibrahim', 'Sule', 'ibrahim.sule@example.com'],
]
const codes = ['PCM', 'NMA', 'CEW', 'PHR', 'PSS', 'PCM']
const statuses = ['submitted', 'under_review', 'under_review', 'changes_requested', 'offered', 'submitted']
const rows: ApplicationRow[] = people.map(([f, s, e], i) => ({
  id: `00000000-0000-0000-0000-00000000000${i}`,
  ref: `APP-26-${['K7Q2MX', 'B4T9LA', 'Z2P8RW', 'M5N1CE', 'R8D3VH', 'Q1W6YT'][i]}`,
  status: statuses[i],
  submitted_at: ago(9 - i),
  created_at: ago(12 - i),
  updated_at: ago(2),
  offer_expires_at: statuses[i] === 'offered' ? ahead(5) : null,
  application_fee_paid_at: ago(10 - i),
  programmes: { code: codes[i], short_title: programmes.find((p) => p.code === codes[i])?.shortTitle ?? '' },
  cohorts: { name: 'February 2027 cohort' },
  profiles: { first_name: f, surname: s, email: e, phone: '+2348031234567' },
}))

const payments: PaymentListRow[] = rows.slice(0, 5).map((r, i) => ({
  id: `10000000-0000-0000-0000-00000000000${i}`,
  receipt_no: `RCT-2026-00012${i}`,
  reference: `IPCM-APP-8c1f2e3d4a5b6c7d8e9f0a1b2c3d4e5${i}`,
  status: 'paid',
  amount_kobo: i === 2 ? 3530000 : 1530000,
  paid_at: ago(i + 0.2),
  created_at: ago(i + 0.2),
  fee_items: { type: i === 2 ? 'tuition' : 'application', programmes: { code: r.programmes!.code } },
  profiles: r.profiles,
  applications: { id: r.id, ref: r.ref },
}))

const detail: ApplicationDetail = {
  id: rows[1].id,
  ref: rows[1].ref,
  status: 'under_review',
  step_data: {
    completed: [1, 2, 3, 4, 5, 6, 7],
    personal: { title: 'Mr', first_name: 'Tersoo', surname: 'Akaa', other_names: 'Joseph', sex: 'male', dob: '1988-04-12', phone: '+2348031234567', state_id: 35, lga_id: 1006, address: 'No. 14 Hammaruwa Way, Jalingo', nin: '12345678901' },
    professional: { employment_status: 'employed', sector: 'ngo', organisation: 'Peace Initiative Network', job_role: 'Programme Officer', years_experience: 6 },
    qualifications: { highest_qualification: 'B.Sc. Sociology', institution: 'Taraba State University', year: 2012, olevel_type: 'WAEC', olevel_year: 2006, is_mature_entry: false },
    sponsorship: { sponsored: 'no' },
    statement: { statement: 'I coordinate community dialogue sessions between farmers and herders in Ardo Kola and Gassol. Most of what I know came from doing the work, and I want a structured grounding in mediation and early warning so that our interventions are more consistent and better documented.\n\nAfter the programme I plan to train volunteer mediators in five wards and set up a simple incident-reporting system with the local government.' },
  } as unknown as ApplicationDetail['step_data'],
  statement: null,
  is_mature_entry: false,
  submitted_at: ago(8),
  offered_at: null,
  offer_expires_at: null,
  decision_reason: null,
  application_fee_paid_at: ago(9),
  created_at: ago(11),
  user_id: 'u',
  programmes: { code: 'NMA', title: 'Certificate in Negotiation, Mediation and Alternative Dispute Resolution', short_title: 'Negotiation, Mediation and ADR' },
  cohorts: { id: 'c', name: 'February 2027 cohort', start_date: '2027-02-06', capacity: 40, offer_expiry_days: 30 },
  profiles: { title: 'Mr', first_name: 'Tersoo', other_names: 'Joseph', surname: 'Akaa', email: 'tersoo.a@example.com', phone: '+2348031234567', sex: 'male', dob: '1988-04-12', address: 'No. 14 Hammaruwa Way, Jalingo', nin: '12345678901', organisation: 'Peace Initiative Network', job_role: 'Programme Officer', lgas: { name: 'Jalingo', states: { name: 'Taraba' } } },
  documents: [],
  application_status_history: [
    { id: 3, from_status: 'submitted', to_status: 'under_review', note: 'Review started', created_at: ago(1), profiles: { first_name: 'Ruth', surname: 'Ishaku', role: 'admissions' } },
    { id: 2, from_status: 'draft', to_status: 'submitted', note: 'Submitted by applicant', created_at: ago(8), profiles: { first_name: 'Tersoo', surname: 'Akaa', role: 'applicant' } },
  ],
}
const docs: ReviewDoc[] = [
  { id: 'd1', label: 'Passport photograph', mime: 'image/jpeg', size: '84 KB', status: 'approved', rejection_reason: null, url: '/placeholders/about.jpg' },
  { id: 'd2', label: 'O’Level result or highest qualification (1 of 2)', mime: 'application/pdf', size: '1.2 MB', status: 'pending', rejection_reason: null, url: '#' },
  { id: 'd3', label: 'O’Level result or highest qualification (2 of 2)', mime: 'application/pdf', size: '640 KB', status: 'rejected', rejection_reason: 'File is unreadable or incomplete. Upload a clear scan of the whole document.', url: '#' },
  { id: 'd4', label: 'Means of identification', mime: 'image/png', size: '410 KB', status: 'pending', rejection_reason: null, url: '/placeholders/research-2.jpg' },
]
const decision = (status: string): DecisionInfo => ({
  id: detail.id, status, offerDays: 30,
  docs: { total: 4, approved: 1, pending: 2, rejected: 1 },
  rejectedLabels: ['O’Level result or highest qualification (2 of 2)'],
  payBy: '6 November 2026', daysLeft: 5, lapsed: status === 'lapsed', extendDefault: '2026-11-20', today: '2026-10-07',
  seats: { taken: 12, capacity: 40 },
})

const cohorts: CohortRow[] = ['PCM', 'NMA', 'CEW'].map((code, i) => ({
  id: `c${i}`, name: 'February 2027 cohort', start_date: '2027-02-06', end_date: '2027-03-27', application_deadline: '2027-01-31',
  capacity: 40, offer_expiry_days: 30, venue: 'IPCM Lecture Hall, Taraba State University, Jalingo', status: i === 2 ? 'draft' : 'open',
  programme_id: `p${i}`, programmes: { code, short_title: programmes.find((p) => p.code === code)?.shortTitle ?? '' },
  seats: { admitted: [18, 4, 0][i], offers_open: [9, 3, 0][i], under_review: [6, 5, 0][i], seats_taken: [27, 7, 0][i] },
}))
const fees: FeeRow[] = programmes.slice(0, 3).flatMap((p, i) => [
  { id: `f${i}a`, type: 'application' as const, base_amount_kobo: 1500000, processing_fee_kobo: 30000, active: true, updated_at: ago(3), programmes: { code: p.code, short_title: p.shortTitle } },
  { id: `f${i}t`, type: 'tuition' as const, base_amount_kobo: 3500000, processing_fee_kobo: 30000, active: true, updated_at: ago(3), programmes: { code: p.code, short_title: p.shortTitle } },
])
const found: PersonRow[] = [{ id: 'p1', first_name: 'Halima', surname: 'Danjuma', other_names: null, email: 'halima.d@exmaple.com', phone: '+2348061112222', role: 'applicant', created_at: ago(14), applications: [{ id: rows[2].id, ref: rows[2].ref, status: 'under_review', programmes: { code: 'CEW' } }] }]

export default async function AdminPreview({ searchParams }: { searchParams: Promise<{ view?: string; role?: Role }> }) {
  const { view = 'dashboard', role = 'super_admin' } = await searchParams
  const user = { name: 'Ruth Ishaku', email: 'ruth@example.com', role }
  let body: React.ReactNode
  if (view === 'list') body = (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Admissions" title="Applications" intro="Open an application to check the documents and make a decision. The oldest submissions are listed first." />
      <ApplicationsList rows={rows} count={rows.length} page={1} size={25} tab="review" params={{ tab: 'review' }} programmes={programmes.map((p) => ({ code: p.code, short_title: p.shortTitle }))} cohorts={[]} />
    </div>
  )
  else if (view === 'review' || view === 'offer' || view === 'lapsed') {
    const status = view === 'review' ? 'under_review' : 'offered'
    body = <ApplicationReview app={{ ...detail, status, offer_expires_at: view === 'lapsed' ? ago(2) : view === 'offer' ? ahead(5) : null }} docs={docs} decision={{ ...decision(status), lapsed: view === 'lapsed' }} photoUrl="/placeholders/about.jpg" />
  }
  else if (view === 'intakes') body = <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Programmes" title="Intakes" intro="Open or close an intake, set its dates and seats." /><Intakes cohorts={cohorts} programmes={programmes.map((p, i) => ({ id: `p${i}`, code: p.code, short_title: p.shortTitle }))} canEdit /></div>
  else if (view === 'fees') body = <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Bursary" title="Fees" /><Fees fees={fees} canEdit /></div>
  else if (view === 'payments') body = <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Bursary" title="Payments" /><div className="mb-6"><RecordPaymentForm /></div><PaymentsList rows={payments} count={payments.length} page={1} size={25} params={{}} /></div>
  else if (view === 'staff') body = (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Super admin" title="Staff accounts" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"><Card><h2 className="mb-4 text-h3 font-semibold">Add a staff member</h2><AddStaffForm /></Card><Card><h2 className="mb-4 text-h3 font-semibold">What each role can do</h2><RoleGuide /></Card></div>
      <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-white shadow-card">
        <StaffRowForm s={{ id: 'a', name: 'Ruth Ishaku', email: 'ruth@example.com', role: 'super_admin', is_active: true, created_at: ago(30) }} self />
        <StaffRowForm s={{ id: 'b', name: 'Musa Danladi', email: 'musa.d@example.com', role: 'admissions', is_active: true, created_at: ago(20) }} self={false} />
        <StaffRowForm s={{ id: 'c', name: 'Grace Tanko', email: 'grace.t@example.com', role: 'bursary', is_active: false, created_at: ago(10) }} self={false} />
      </ul>
    </div>
  )
  else if (view === 'website') body = (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Content" title="Website" />
      <Tabs current="people" items={[{ key: 'people', label: 'People', href: '#' }, { key: 'research', label: 'Research', href: '#' }]} />
      <div className="mt-6 space-y-4"><AddPanel title="Add a person"><PersonForm /></AddPanel>
        <PeopleList people={[{ id: 'p1', name: 'Prof. Elijah Akombo', role: 'Director', group_name: 'director', bio: null, expertise: [], sort_order: 0, photo: '/people/elijah-akombo-square.jpg' }, { id: 'p2', name: 'Dr. Amina Bello', role: 'Programmes Coordinator', group_name: 'staff', bio: null, expertise: ['Mediation'], sort_order: 10, photo: null }]} />
      </div>
    </div>
  )
  else if (view === 'help') body = <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Support" title="Applicant help" /><ApplicantHelp q="halima" people={found} canOpenApplications /></div>
  else body = (
    <AdminDashboard
      name={user.name}
      role={role}
      figures={{ new: 4, under_review: 7, changes_requested: 3, offers_open: 12, offers_lapsed: 1, admitted: 22, in_progress: 9, oldest_waiting: ago(9), received_kobo: 132_180_000, received_application_kobo: 54_180_000, received_tuition_kobo: 78_000_000, payments_count: 58 }}
      waiting={rows.slice(0, 5)}
      lapsing={[rows[4]]}
      payments={payments}
    />
  )
  return <AdminShell user={user}>{body}</AdminShell>
}
