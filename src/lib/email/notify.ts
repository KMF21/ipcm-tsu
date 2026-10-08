import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReceiptPdf } from '@/lib/receipts/pdf'
import { verifyPath, type Receipt } from '@/lib/receipts/types'
import { buildAdmissionLetterPdf } from '@/lib/letters/pdf'
import { letterFileName } from '@/lib/letters/respond'
import { letterVerifyPath, weekdayDate, type AdmissionLetter } from '@/lib/letters/types'
import { DOC_RULES, type DocType } from '@/lib/application/steps'
import { lastPayDay } from '@/lib/admin/status'
import { site } from '@/lib/site'
import { sendEmail } from './send'
import * as T from './templates'

/**
 * Emails sent when something happens. Each function loads what it needs with the service role,
 * so it can run after the page has already responded. None of them throw.
 */

type Ctx = T.EmailContext

/** After Paystack confirms a payment (first confirmation only). */
export async function notifyPaymentConfirmed(ctx: Ctx, reference: string) {
  try {
    const admin = createAdminClient()
    const { data: pay } = await admin.from('payments').select('id').eq('reference', reference).single()
    if (!pay) return
    const { data } = await admin.rpc('receipt_json', { p_payment: pay.id })
    const r = data as (Receipt & { application_id: string | null; payer_first_name: string; user_id: string }) | null
    if (!r) return
    const receiptPdf = await buildReceiptPdf(r, `${ctx.baseUrl}${verifyPath(r.verify_token)}`)
    const receiptFile = { filename: `IPCM-Receipt-${r.receipt_no}.pdf`, content: receiptPdf }

    if (r.fee_type === 'tuition' && r.application_id) {
      const { data: l } = await admin.rpc('letter_json', { p_app: r.application_id })
      const letter = l as AdmissionLetter | null
      if (!letter) return
      const letterPdf = await buildAdmissionLetterPdf(letter, `${ctx.baseUrl}${letterVerifyPath(letter.letter_token)}`)
      const e = T.admitted(ctx, {
        firstName: r.payer_first_name,
        regNo: letter.reg_no,
        programme: letter.programme_title,
        cohort: letter.cohort_name,
        startDate: weekdayDate(letter.start_date),
        venue: letter.venue || site.venue.value,
        receiptNo: r.receipt_no,
        amountKobo: r.amount_kobo,
      })
      await sendEmail({ ...e, to: r.payer_email, kind: 'admitted', userId: r.user_id, applicationId: r.application_id, dedupeKey: `payment:${r.id}`, attachments: [{ filename: letterFileName(letter.reg_no), content: letterPdf }, receiptFile] })
      return
    }
    const e = T.applicationFeePaid(ctx, { firstName: r.payer_first_name, programme: r.programme_title, receiptNo: r.receipt_no, amountKobo: r.amount_kobo })
    await sendEmail({ ...e, to: r.payer_email, kind: `paid_${r.fee_type}`, userId: r.user_id, applicationId: r.application_id, dedupeKey: `payment:${r.id}`, attachments: [receiptFile] })
  } catch (e) {
    console.error('[email] notifyPaymentConfirmed', e)
  }
}

type AppForEmail = {
  id: string
  ref: string
  user_id: string
  status: string
  offered_at: string | null
  offer_expires_at: string | null
  decision_reason: string | null
  programme_id: string
  programmes: { title: string } | null
  cohorts: { name: string; start_date: string } | null
  profiles: { first_name: string | null; email: string } | null
}

async function loadApp(applicationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('applications')
    .select('id, ref, user_id, status, offered_at, offer_expires_at, decision_reason, programme_id, programmes(title), cohorts(name, start_date), profiles(first_name, email)')
    .eq('id', applicationId)
    .single()
  return { admin, app: data as unknown as AppForEmail | null }
}

async function tuitionKobo(admin: ReturnType<typeof createAdminClient>, programmeId: string) {
  const { data } = await admin.from('fee_items').select('base_amount_kobo, processing_fee_kobo').eq('programme_id', programmeId).eq('type', 'tuition').single()
  return (data?.base_amount_kobo ?? 0) + (data?.processing_fee_kobo ?? 0)
}

export type ApplicationEvent = 'submitted' | 'changes_requested' | 'offer' | 'extended' | 'declined' | 'withdrawn'

/** After the applicant submits, or after a staff decision. */
export async function notifyApplication(ctx: Ctx, applicationId: string, event: ApplicationEvent, extra: { note?: string | null } = {}) {
  try {
    const { admin, app } = await loadApp(applicationId)
    if (!app?.profiles?.email) return
    const first = app.profiles.first_name ?? ''
    const programme = app.programmes?.title ?? 'programme'
    const base = { to: app.profiles.email, userId: app.user_id, applicationId: app.id }

    if (event === 'submitted') {
      await sendEmail({ ...T.applicationSubmitted(ctx, { firstName: first, ref: app.ref, programme }), ...base, kind: 'submitted', dedupeKey: `submitted:${app.id}` })
    } else if (event === 'changes_requested') {
      const { data: docs } = await admin.from('documents').select('type, rejection_reason').eq('application_id', app.id).eq('status', 'rejected')
      const items = (docs ?? []).map((d) => ({ label: DOC_RULES[d.type as DocType]?.label ?? d.type, reason: d.rejection_reason ?? '' }))
      await sendEmail({ ...T.changesRequested(ctx, { firstName: first, items, note: extra.note }), ...base, kind: 'changes_requested' })
    } else if (event === 'offer' && app.offer_expires_at) {
      const e = T.offerMade(ctx, { firstName: first, programme, cohort: app.cohorts?.name ?? '', startDate: app.cohorts ? weekdayDate(app.cohorts.start_date) : '', payBy: lastPayDay(app.offer_expires_at), amountKobo: await tuitionKobo(admin, app.programme_id) })
      await sendEmail({ ...e, ...base, kind: 'offer', dedupeKey: `offer:${app.id}:${app.offered_at}` })
    } else if (event === 'extended' && app.offer_expires_at) {
      await sendEmail({ ...T.offerExtended(ctx, { firstName: first, programme, payBy: lastPayDay(app.offer_expires_at) }), ...base, kind: 'offer_extended', dedupeKey: `extended:${app.id}:${app.offer_expires_at}` })
    } else if (event === 'withdrawn') {
      await sendEmail({ ...T.offerWithdrawn(ctx, { firstName: first, programme, reason: extra.note ?? '' }), ...base, kind: 'offer_withdrawn', dedupeKey: `withdrawn:${app.id}` })
    } else if (event === 'declined') {
      await sendEmail({ ...T.applicationDeclined(ctx, { firstName: first, programme, reason: app.decision_reason ?? '' }), ...base, kind: 'declined', dedupeKey: `declined:${app.id}` })
    }
  } catch (e) {
    console.error('[email] notifyApplication', event, e)
  }
}

/**
 * Daily: remind applicants 7 days and 2 days before their offer ends, and tell them once when it lapses.
 * The dedupe key includes the deadline, so an extended offer gets fresh reminders.
 */
export async function sendOfferReminders(ctx: Ctx, now = new Date()) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('applications')
    .select('id, ref, user_id, status, offered_at, offer_expires_at, decision_reason, programme_id, programmes(title), cohorts(name, start_date), profiles(first_name, email)')
    .eq('status', 'offered')
    .gte('offer_expires_at', new Date(now.getTime() - 2 * 86_400_000).toISOString())
    .lte('offer_expires_at', new Date(now.getTime() + 8 * 86_400_000).toISOString())
  const apps = (data ?? []) as unknown as AppForEmail[]
  const day = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })).getTime()
  const summary = { checked: apps.length, sent: 0 }
  for (const app of apps) {
    if (!app.offer_expires_at || !app.profiles?.email) continue
    const lastDay = new Date(new Date(app.offer_expires_at).getTime() - 1000)
    const daysLeft = Math.round((day(lastDay) - day(now)) / 86_400_000)
    const first = app.profiles.first_name ?? ''
    const programme = app.programmes?.title ?? 'programme'
    const payBy = lastPayDay(app.offer_expires_at)
    const base = { to: app.profiles.email, userId: app.user_id, applicationId: app.id }
    let res
    if (daysLeft === 7 || daysLeft === 2) {
      const e = T.offerReminder(ctx, { firstName: first, programme, payBy, daysLeft, amountKobo: await tuitionKobo(admin, app.programme_id) })
      res = await sendEmail({ ...e, ...base, kind: `offer_reminder_${daysLeft}`, dedupeKey: `reminder${daysLeft}:${app.id}:${app.offer_expires_at}` })
    } else if (daysLeft < 0) {
      res = await sendEmail({ ...T.offerLapsed(ctx, { firstName: first, programme, payBy }), ...base, kind: 'offer_lapsed', dedupeKey: `lapsed:${app.id}:${app.offer_expires_at}` })
    }
    if (res?.status === 'sent') summary.sent++
  }
  return summary
}


/** Emails every student in an intake (announcements) or each student their outcome (results). */
export async function notifyClass(ctx: Ctx, cohortId: string, what: { kind: 'announcement'; title: string; body: string } | { kind: 'results' }) {
  try {
    const admin = createAdminClient()
    const { data: c } = await admin.from('cohorts').select('name, programmes(title)').eq('id', cohortId).single()
    const programme = (c?.programmes as unknown as { title: string } | null)?.title ?? 'programme'
    const { data: rows } = await admin
      .from('enrolments')
      .select('id, user_id, application_id, profiles!enrolments_user_id_fkey(first_name, email), results(classification, published_at)')
      .eq('cohort_id', cohortId)
    for (const e of (rows ?? []) as unknown as { id: string; user_id: string; application_id: string; profiles: { first_name: string | null; email: string } | null; results: { classification: string | null; published_at: string | null } | { classification: string | null; published_at: string | null }[] | null }[]) {
      if (!e.profiles?.email) continue
      const base = { to: e.profiles.email, userId: e.user_id, applicationId: e.application_id }
      if (what.kind === 'announcement') {
        await sendEmail({ ...T.classAnnouncement(ctx, { firstName: e.profiles.first_name ?? '', programme, cohort: c?.name ?? '', title: what.title, body: what.body }), ...base, kind: 'announcement' })
      } else {
        const r = Array.isArray(e.results) ? e.results[0] : e.results
        if (!r?.published_at || !r.classification) continue
        await sendEmail({ ...T.resultsPublished(ctx, { firstName: e.profiles.first_name ?? '', programme, classification: r.classification }), ...base, kind: 'results', dedupeKey: `results:${e.id}:${r.published_at}` })
      }
    }
  } catch (err) {
    console.error('[email] notifyClass', err)
  }
}
