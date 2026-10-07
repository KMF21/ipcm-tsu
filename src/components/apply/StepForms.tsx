'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveProgrammeStep, saveStep, type StepState } from '@/lib/application/actions'
import { EMPLOYMENT, OLEVEL_TYPES, QUALIFICATIONS, SECTORS, TITLES, type StepData } from '@/lib/application/steps'
import type { OpenCohort, StateWithLgas } from '@/lib/application/queries'
import { formatDate } from '@/lib/utils'
import { CheckboxField, FormMessage, RadioCards, SelectInput, StepNav, TextInput, WordCountTextarea } from './fields'

type ProgrammeOption = { code: string; title: string; promise: string }

function useStep(step: number) {
  const [state, action] = useActionState<StepState, FormData>(step === 1 ? saveProgrammeStep : saveStep, {})
  return { state, action, e: state.errors ?? {}, v: state.values ?? {} }
}

/* 1. Programme and intake */
export function ProgrammeStep({ programmes, cohorts, saved, preselect }: { programmes: ProgrammeOption[]; cohorts: OpenCohort[]; saved?: StepData['programme']; preselect?: string }) {
  const { state, action, e, v } = useStep(1)
  const initial = v.programme ?? saved?.programme ?? (programmes.some((p) => p.code === preselect) ? preselect : '') ?? ''
  const [programme, setProgramme] = useState(initial)
  const intakes = cohorts.filter((c) => c.programme_code === programme)
  const savedCohort = v.cohort_id ?? saved?.cohort_id
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage message={state.message} />
      <RadioCards
        name="programme"
        label="Programme"
        columns={1}
        defaultValue={initial}
        onChange={setProgramme}
        error={e.programme}
        options={programmes.map((p) => ({ value: p.code, label: `${p.code} · ${p.title}`, description: p.promise }))}
      />
      {programme && (
        <div>
          {intakes.length ? (
            <SelectInput
              key={programme}
              name="cohort_id"
              label="Intake"
              hint="Classes hold on Saturdays for 8 weeks."
              defaultValue={intakes.some((c) => c.id === savedCohort) ? savedCohort : intakes.length === 1 ? intakes[0].id : ''}
              error={e.cohort_id}
              options={intakes.map((c) => [c.id, `${c.name} · starts ${formatDate(c.start_date)} · apply by ${formatDate(c.application_deadline)}`] as const)}
            />
          ) : (
            <p className="rounded-card bg-amber-50 p-4 text-base text-ink" role="status">
              There’s no open intake for this programme right now. Choose another programme or check back soon.
            </p>
          )}
        </div>
      )}
      <StepNav step={1} />
    </form>
  )
}

/* 2. Personal details */
export function PersonalStep({ saved, profile, states }: { saved?: StepData['personal']; profile: Record<string, string | number | null>; states: StateWithLgas[] }) {
  const { state, action, e, v } = useStep(2)
  const pick = (k: string) => (v[k] ?? (saved as Record<string, unknown> | undefined)?.[k] ?? profile[k] ?? '') as string
  const [stateId, setStateId] = useState(String(pick('state_id')))
  const lgas = useMemo(() => states.find((s) => String(s.id) === stateId)?.lgas ?? [], [states, stateId])
  const maxDob = new Date(Date.now() - 16 * 365.25 * 864e5).toISOString().slice(0, 10)
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="2" />
      <FormMessage message={state.message} />
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <SelectInput name="title" label="Title" options={TITLES} defaultValue={pick('title')} error={e.title} />
        <TextInput name="surname" label="Surname" autoComplete="family-name" defaultValue={pick('surname')} error={e.surname} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput name="first_name" label="First name" autoComplete="given-name" defaultValue={pick('first_name')} error={e.first_name} />
        <TextInput name="other_names" label="Other names" required={false} defaultValue={pick('other_names')} error={e.other_names} />
      </div>
      <p className="-mt-2 text-sm text-ink-muted">Write your name exactly as it should appear on your certificate.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <RadioCards name="sex" label="Sex" defaultValue={pick('sex')} error={e.sex} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
        <TextInput name="dob" label="Date of birth" type="date" max={maxDob} defaultValue={pick('dob')} error={e.dob} />
      </div>
      <TextInput name="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" hint="We’ll call or text you about your admission." defaultValue={pick('phone')} error={e.phone} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectInput
          name="state_id"
          label="State of origin"
          value={stateId}
          onChange={setStateId}
          error={e.state_id}
          options={states.map((s) => [String(s.id), s.name] as const)}
        />
        <SelectInput
          key={stateId}
          name="lga_id"
          label="Local Government Area"
          placeholder={stateId ? 'Select your LGA' : 'Choose a state first'}
          disabled={!stateId}
          defaultValue={lgas.some((l) => String(l.id) === String(pick('lga_id'))) ? String(pick('lga_id')) : ''}
          error={e.lga_id}
          options={lgas.map((l) => [String(l.id), l.name] as const)}
        />
      </div>
      <TextInput name="address" label="Residential address" autoComplete="street-address" defaultValue={pick('address')} error={e.address} />
      <TextInput name="nin" label="NIN (National Identification Number)" required={false} inputMode="numeric" hint="Optional. 11 digits." defaultValue={pick('nin')} error={e.nin} />
      <StepNav step={2} />
    </form>
  )
}

/* 3. Work and experience */
export function ProfessionalStep({ saved, profile }: { saved?: StepData['professional']; profile: Record<string, string | number | null> }) {
  const { state, action, e, v } = useStep(3)
  const pick = (k: string) => (v[k] ?? (saved as Record<string, unknown> | undefined)?.[k] ?? profile[k] ?? '') as string
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="3" />
      <FormMessage message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectInput name="employment_status" label="Employment status" options={EMPLOYMENT} defaultValue={pick('employment_status')} error={e.employment_status} />
        <SelectInput name="sector" label="Sector" options={SECTORS} defaultValue={pick('sector')} error={e.sector} />
      </div>
      <TextInput name="organisation" label="Organisation or employer" required={false} hint="Required if you are employed or self-employed." defaultValue={pick('organisation')} error={e.organisation} />
      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <TextInput name="job_role" label="Your role or rank" required={false} placeholder="e.g. Inspector, Admin Officer, Village Head" defaultValue={pick('job_role')} error={e.job_role} />
        <TextInput name="years_experience" label="Years of experience" type="number" inputMode="numeric" defaultValue={pick('years_experience')} error={e.years_experience} />
      </div>
      <StepNav step={3} />
    </form>
  )
}

/* 4. Education */
export function QualificationsStep({ saved }: { saved?: StepData['qualifications'] }) {
  const { state, action, e, v } = useStep(4)
  const pick = (k: string) => (v[k] ?? (saved as Record<string, unknown> | undefined)?.[k] ?? '') as string
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - 1959 }, (_, i) => String(thisYear - i))
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="4" />
      <FormMessage message={state.message} />
      <SelectInput name="highest_qualification" label="Highest qualification" options={QUALIFICATIONS} defaultValue={pick('highest_qualification')} error={e.highest_qualification} />
      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <TextInput name="institution" label="Institution" defaultValue={pick('institution')} error={e.institution} />
        <SelectInput name="year" label="Year obtained" options={years} defaultValue={pick('year')} error={e.year} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectInput name="olevel_type" label="O’Level examination" options={OLEVEL_TYPES} defaultValue={pick('olevel_type')} error={e.olevel_type} />
        <SelectInput name="olevel_year" label="O’Level year" required={false} options={years} defaultValue={pick('olevel_year')} error={e.olevel_year} placeholder="Select year (if any)" />
      </div>
      <CheckboxField name="is_mature_entry" label="Apply as a mature entrant" defaultChecked={v.is_mature_entry ? v.is_mature_entry === 'on' : !!saved?.is_mature_entry} error={e.is_mature_entry}>
        For applicants aged 25 or above with at least 2 years of relevant work or community experience. You’ll upload a CV as evidence.
      </CheckboxField>
      <StepNav step={4} />
    </form>
  )
}

/* 5. Sponsorship */
export function SponsorshipStep({ saved }: { saved?: StepData['sponsorship'] }) {
  const { state, action, e, v } = useStep(5)
  const pick = (k: string) => (v[k] ?? (saved as Record<string, unknown> | undefined)?.[k] ?? '') as string
  const [sponsored, setSponsored] = useState(pick('sponsored'))
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="5" />
      <FormMessage message={state.message} />
      <RadioCards
        name="sponsored"
        label="Who will pay your tuition?"
        columns={1}
        defaultValue={sponsored}
        onChange={setSponsored}
        error={e.sponsored}
        options={[
          { value: 'no', label: 'I will pay myself', description: 'You pay the application fee and tuition online.' },
          { value: 'yes', label: 'My organisation is sponsoring me', description: 'For example a security agency, ministry, LGA or NGO. You’ll upload their letter.' },
        ]}
      />
      {sponsored === 'yes' && (
        <div className="space-y-5 rounded-card border border-line bg-canvas p-5">
          <TextInput name="sponsor_organisation" label="Sponsoring organisation" defaultValue={pick('sponsor_organisation')} error={e.sponsor_organisation} />
          <TextInput name="sponsor_contact_name" label="Contact person" defaultValue={pick('sponsor_contact_name')} error={e.sponsor_contact_name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput name="sponsor_contact_phone" label="Contact phone" type="tel" inputMode="tel" required={false} defaultValue={pick('sponsor_contact_phone')} error={e.sponsor_contact_phone} />
            <TextInput name="sponsor_contact_email" label="Contact email" type="email" inputMode="email" required={false} defaultValue={pick('sponsor_contact_email')} error={e.sponsor_contact_email} />
          </div>
          <p className="text-sm text-ink-muted">Sponsored applicants still pay the application fee themselves unless the institute waives it.</p>
        </div>
      )}
      <StepNav step={5} />
    </form>
  )
}

/* 7. Statement */
export function StatementStep({ saved }: { saved?: StepData['statement'] }) {
  const { state, action, e, v } = useStep(7)
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="7" />
      <FormMessage message={state.message} />
      <WordCountTextarea
        name="statement"
        label="Tell us about your work and what you hope to gain"
        hint="Mention your role, a conflict or challenge you deal with, and how this programme will help you. Plain, simple English is fine."
        defaultValue={v.statement ?? saved?.statement}
        error={e.statement}
        min={100}
        max={300}
      />
      <StepNav step={7} />
    </form>
  )
}

/* 8. Declaration (the summary is rendered on the server above this form) */
export function DeclarationForm() {
  const { state, action, e } = useStep(8)
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="$step" value="8" />
      <FormMessage message={state.message} />
      <CheckboxField name="declaration" label="I declare that the information I have given is true and complete." error={e.declaration}>
        I understand that false information may lead to my application being refused or my admission being withdrawn.
      </CheckboxField>
      <StepNav step={8} continueLabel="Continue to payment" />
    </form>
  )
}
