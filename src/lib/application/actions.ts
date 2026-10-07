'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { notifyApplication } from '@/lib/email/notify'
import { siteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { DOC_RULES, LAST_STEP, STEPS, formatBytes, schemas, sniffMime, type DocType, type StepData, type StepKey } from './steps'
import { getMyApplication } from './queries'

export type StepState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> }

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const i of issues) {
    const k = String(i.path[0] ?? 'form')
    if (!out[k]) out[k] = i.message
  }
  return out
}

function formValues(fd: FormData) {
  const out: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string' && !k.startsWith('$')) out[k] = v
  return out
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply')
  return { supabase, user }
}

function nextUrl(step: number, intent: string) {
  if (intent === 'exit') return '/portal?saved=1'
  if (intent === 'back') return `/portal/apply?step=${Math.max(1, step - 1)}`
  return `/portal/apply?step=${Math.min(LAST_STEP, step + 1)}`
}

/** Step 1: create the draft application (or move an existing draft to another programme/intake). */
export async function saveProgrammeStep(_: StepState, fd: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const parsed = schemas.programme.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { errors: issuesToErrors(parsed.error.issues), values: formValues(fd) }

  const { data: cohort } = await supabase
    .from('cohorts')
    .select('id, status, application_deadline, accept_late, programme_id, programmes!inner(code)')
    .eq('id', parsed.data.cohort_id)
    .single()
  const code = (cohort?.programmes as unknown as { code: string } | null)?.code
  if (!cohort || code !== parsed.data.programme || cohort.status !== 'open') {
    return { errors: { cohort_id: 'This intake is not open. Choose another.' }, values: formValues(fd) }
  }
  if (!cohort.accept_late && new Date(cohort.application_deadline + 'T23:59:59+01:00') < new Date()) {
    return { errors: { cohort_id: 'Applications for this intake have closed.' }, values: formValues(fd) }
  }

  const latest = await getMyApplication(supabase, user.id)
  // A closed application (declined, withdrawn, lapsed) means this is a fresh application.
  const existing = latest && ['declined', 'withdrawn', 'offer_expired'].includes(latest.status) ? null : latest
  if (existing && existing.status !== 'draft') redirect('/portal/apply')

  if (existing) {
    const data: StepData = { ...(existing.step_data as StepData), programme: parsed.data }
    data.completed = Array.from(new Set([...(data.completed ?? []), 1]))
    const { error } = await supabase
      .from('applications')
      .update({ programme_id: cohort.programme_id, cohort_id: cohort.id, step_data: data })
      .eq('id', existing.id)
    if (error) return { message: 'We couldn’t save this step. Please try again.', values: formValues(fd) }
  } else {
    const { error } = await supabase.from('applications').insert({
      user_id: user.id,
      programme_id: cohort.programme_id,
      cohort_id: cohort.id,
      step_data: { programme: parsed.data, completed: [1] },
    })
    if (error) {
      if (error.code === '23505') return { errors: { cohort_id: 'You have already applied for this intake. Choose a later one.' }, values: formValues(fd) }
      if (error.message.includes('in progress')) redirect('/portal/apply')
      return { message: 'We couldn’t start your application. Please try again.', values: formValues(fd) }
    }
  }
  revalidatePath('/portal', 'layout')
  const intent = String(fd.get('intent') ?? 'next')
  // Middle path: after choosing a programme, the applicant sees the checklist and pays before the rest of the form.
  if (intent === 'next' && !existing?.application_fee_paid_at) redirect('/portal/apply/pay')
  redirect(nextUrl(1, intent))
}

/** Steps 2–5, 7 and 8: validate, merge into step_data, mirror profile fields, move on. */
export async function saveStep(_: StepState, fd: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const step = Number(fd.get('$step'))
  const def = STEPS.find((s) => s.n === step)
  const intent = String(fd.get('intent') ?? 'next')
  if (!def || def.key === 'programme' || def.key === 'documents') return { message: 'Unknown step.' }

  const app = await getMyApplication(supabase, user.id)
  if (!app) redirect('/portal/apply?step=1')
  if (app.status !== 'draft') redirect('/portal/apply')
  if (!app.application_fee_paid_at) redirect('/portal/apply/pay')
  const current = (app.step_data ?? {}) as StepData

  // "Back" and "Save and exit" keep whatever was typed without forcing every field to be valid.
  const key = def.key as Exclude<StepKey, 'programme' | 'documents'>
  const parsed = schemas[key].safeParse(Object.fromEntries(fd))
  if (!parsed.success) {
    if (intent !== 'next') redirect(nextUrl(step, intent))
    return { errors: issuesToErrors(parsed.error.issues), values: formValues(fd) }
  }

  // Entry-rule mismatches (mature entry under 25, no O'Level) no longer block the applicant:
  // admissions sees them flagged on the review screen and decides.
  if (key === 'review') {
    // Missing documents don't block submission: admissions sees what's missing and can ask for it.
    const incomplete = [1, 2, 3, 4, 5, 7].filter((n) => !(current.completed ?? []).includes(n))
    if (incomplete.length) {
      return { message: 'Some sections are incomplete. Use the Edit links above to finish them.' }
    }
  }

  const value = key === 'review' ? { declaration: 'on' as const, declared_at: new Date().toISOString() } : parsed.data
  const data: StepData = { ...current, [key]: value }
  data.completed = Array.from(new Set([...(current.completed ?? []), step]))

  const patch: Record<string, unknown> = { step_data: data }
  if (key === 'statement') patch.statement = (parsed.data as { statement: string }).statement
  if (key === 'qualifications') patch.is_mature_entry = !!(parsed.data as { is_mature_entry: boolean }).is_mature_entry
  const { error } = await supabase.from('applications').update(patch).eq('id', app.id)
  if (error) return { message: 'We couldn’t save this step. Please try again.', values: formValues(fd) }

  // Keep the profile in step with what the applicant told us (used on letters and certificates).
  if (key === 'personal') {
    const p = parsed.data as NonNullable<StepData['personal']>
    await supabase
      .from('profiles')
      .update({ title: p.title, surname: p.surname, first_name: p.first_name, other_names: p.other_names ?? null, sex: p.sex, dob: p.dob, phone: p.phone, state_id: p.state_id, lga_id: p.lga_id, address: p.address })
      .eq('id', user.id)
  }
  if (key === 'professional') {
    const p = parsed.data as NonNullable<StepData['professional']>
    await supabase
      .from('profiles')
      .update({ organisation: p.organisation ?? null, job_role: p.job_role ?? null, sector: p.sector, years_experience: p.years_experience })
      .eq('id', user.id)
  }

  if (key === 'review') {
    const { error: submitError } = await supabase.rpc('applicant_submit', { p_application: app.id })
    if (submitError) return { message: 'We couldn’t submit your application. Please try again.' }
    const baseUrl = await siteUrl()
    after(() => notifyApplication({ baseUrl }, app.id, 'submitted'))
    revalidatePath('/portal', 'layout')
    redirect('/portal/apply?submitted=1')
  }
  revalidatePath('/portal', 'layout')
  redirect(nextUrl(step, intent))
}

/** Step 6: upload one document. The server checks the real file type and size before storing it. */
export async function uploadDocument(_: StepState, fd: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const type = String(fd.get('type')) as DocType
  const rule = DOC_RULES[type]
  const file = fd.get('file')
  if (!rule) return { message: 'Unknown document type.' }
  if (!(file instanceof File) || file.size === 0) return { errors: { [type]: 'Choose a file to upload.' } }

  const app = await getMyApplication(supabase, user.id)
  if (!app || !['draft', 'changes_requested'].includes(app.status)) return { message: 'Your application can no longer be changed.' }
  if (app.status === 'draft' && !app.application_fee_paid_at) return { message: 'Pay the application fee first.' }

  if (file.size > rule.maxBytes) return { errors: { [type]: `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(rule.maxBytes)}.` } }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = sniffMime(bytes.subarray(0, 16))
  if (!mime || !rule.mimes.includes(mime)) {
    const allowed = rule.mimes.map((m) => (m === 'application/pdf' ? 'PDF' : m === 'image/png' ? 'PNG' : 'JPG')).join(' or ')
    return { errors: { [type]: `This file isn’t a valid ${allowed}. Please choose another file.` } }
  }

  const { data: existing } = await supabase.from('documents').select('id, storage_path').eq('application_id', app.id).eq('type', type)
  if ((existing?.length ?? 0) >= rule.max) {
    return { errors: { [type]: rule.max === 1 ? 'Remove the current file first, then upload the new one.' : `You can upload up to ${rule.max} files here.` } }
  }

  const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg'
  const path = `${user.id}/${app.id}/${type}-${randomUUID()}.${ext}`
  const up = await supabase.storage.from('applicant-documents').upload(path, bytes, { contentType: mime, upsert: false })
  if (up.error) return { errors: { [type]: 'Upload failed. Check your connection and try again.' } }

  const { error } = await supabase.from('documents').insert({ application_id: app.id, user_id: user.id, type, storage_path: path, mime, size_bytes: file.size })
  if (error) {
    await supabase.storage.from('applicant-documents').remove([path])
    return { errors: { [type]: 'We couldn’t save this document. Please try again.' } }
  }

  // Re-uploading after a rejection puts the application back in the review queue.
  if (app.status === 'changes_requested') {
    const { count } = await supabase.from('documents').select('id', { count: 'exact', head: true }).eq('application_id', app.id).eq('status', 'rejected')
    if (!count) await supabase.rpc('applicant_resubmit', { p_application: app.id })
  }
  revalidatePath('/portal/apply')
  return { message: 'uploaded' }
}

export async function removeDocument(fd: FormData) {
  const { supabase, user } = await requireUser()
  const id = String(fd.get('id'))
  const { data: doc } = await supabase.from('documents').select('id, storage_path, status').eq('id', id).eq('user_id', user.id).single()
  if (doc && doc.status !== 'approved') {
    await supabase.storage.from('applicant-documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
  }
  revalidatePath('/portal/apply')
}

/** Step 6 "Continue": only when every required document is present. */
export async function finishDocuments(_: StepState, fd: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const intent = String(fd.get('intent') ?? 'next')
  const app = await getMyApplication(supabase, user.id)
  if (!app) redirect('/portal/apply?step=1')
  const current = (app.step_data ?? {}) as StepData
  if (intent === 'next') {
    // Applicants can move on with a document missing (e.g. a certificate they're still collecting).
    const data: StepData = { ...current, completed: Array.from(new Set([...(current.completed ?? []), 6])) }
    await supabase.from('applications').update({ step_data: data }).eq('id', app.id)
  }
  revalidatePath('/portal', 'layout')
  redirect(nextUrl(6, intent))
}

/** Closes a lapsed offer so the applicant can apply for a later intake. */
export async function applyAgain() {
  const { supabase } = await requireUser()
  await supabase.rpc('applicant_close_lapsed_offer')
  revalidatePath('/portal', 'layout')
  redirect('/portal/apply?step=1&again=1')
}
