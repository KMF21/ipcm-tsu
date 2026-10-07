import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type EmailAttachment = { filename: string; content: Uint8Array }

export type OutgoingEmail = {
  to: string
  subject: string
  html: string
  text: string
  kind: string
  userId?: string | null
  applicationId?: string | null
  /** Same key twice = second one is skipped (used for reminders and payment emails). */
  dedupeKey?: string
  attachments?: EmailAttachment[]
}

export type SendResult = { status: 'sent' | 'failed' | 'skipped' | 'duplicate'; error?: string }

/**
 * Sends one email through Resend and records it in email_log. Never throws: an email problem
 * must not break a payment, a submission or a staff decision.
 */
export async function sendEmail(m: OutgoingEmail): Promise<SendResult> {
  const admin = createAdminClient()
  const { data: row, error: logError } = await admin
    .from('email_log')
    .insert({ user_id: m.userId ?? null, application_id: m.applicationId ?? null, kind: m.kind, dedupe_key: m.dedupeKey ?? null, to_email: m.to, subject: m.subject })
    .select('id')
    .single()
  if (logError) {
    if (logError.code === '23505') return { status: 'duplicate' }
    console.error('[email] could not log', m.kind, logError.message)
  }
  const finish = async (status: 'sent' | 'failed' | 'skipped', extra: { provider_id?: string; error?: string } = {}) => {
    if (row) await admin.from('email_log').update({ status, ...extra }).eq('id', row.id)
    return { status, error: extra.error } as SendResult
  }

  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    console.info(`[email] not sent (RESEND_API_KEY or EMAIL_FROM missing): ${m.kind} to ${m.to}`)
    return finish('skipped', { error: 'Email is not set up yet' })
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [m.to],
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        subject: m.subject,
        html: m.html,
        text: m.text,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') })),
        tags: [{ name: 'kind', value: m.kind.replace(/[^a-zA-Z0-9_-]/g, '_') }],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) {
      console.error('[email] Resend refused', m.kind, res.status, body.message)
      return finish('failed', { error: `${res.status}: ${body.message ?? 'unknown'}`.slice(0, 300) })
    }
    return finish('sent', { provider_id: body.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[email] send failed', m.kind, msg)
    return finish('failed', { error: msg.slice(0, 300) })
  }
}
