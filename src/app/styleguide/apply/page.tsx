import { Card, Stepper } from '@/components/ui'
import { PersonalStep, ProfessionalStep, ProgrammeStep, QualificationsStep, SponsorshipStep, StatementStep, DeclarationForm } from '@/components/apply/StepForms'
import { DocumentsStep } from '@/components/apply/DocumentsStep'
import { STEPS } from '@/lib/application/steps'
import { programmes } from '@/lib/programmes'

export const metadata = { title: 'Application wizard preview', robots: { index: false, follow: false } }

const states = [
  { id: 35, name: 'Taraba', lgas: ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'].map((name, i) => ({ id: 1000 + i, name })) },
  { id: 2, name: 'Adamawa', lgas: [{ id: 2001, name: 'Yola North' }, { id: 2002, name: 'Yola South' }] },
]
const cohorts = programmes.map((p, i) => ({ id: `00000000-0000-0000-0000-00000000000${i}`, name: `${p.code} – February 2027`, start_date: '2027-02-06', end_date: '2027-03-27', application_deadline: '2027-01-31', capacity: 40, programme_code: p.code }))

/** Design preview of each wizard step with sample data (submitting needs a signed-in session). */
export default async function WizardPreview({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const step = Math.min(8, Math.max(1, Number((await searchParams).step) || 1))
  const body = {
    1: <ProgrammeStep programmes={programmes.map((p) => ({ code: p.code, title: p.shortTitle, promise: p.promise }))} cohorts={cohorts} preselect="NMA" />,
    2: <PersonalStep profile={{ first_name: 'Amina', surname: 'Bello' }} states={states} />,
    3: <ProfessionalStep profile={{}} />,
    4: <QualificationsStep />,
    5: <SponsorshipStep />,
    6: <DocumentsStep required={['passport_photo', 'qualification']} optional={['identification']} documents={[{ id: 'x', type: 'qualification', mime: 'application/pdf', size_bytes: 412000, status: 'pending', rejection_reason: null, created_at: '', storage_path: '' }]} />,
    7: <StatementStep />,
    8: <DeclarationForm />,
  }[step]
  return (
    <main id="main" className="min-h-screen bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Application · Step {step} of 8</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">{STEPS[step - 1].heading}</h1>
        <Card className="mt-6">
          <div className="mb-8"><Stepper steps={STEPS.map((s) => s.title)} current={step - 1} /></div>
          {body}
        </Card>
      </div>
    </main>
  )
}
