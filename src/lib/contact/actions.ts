'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { contactReceived, contactToStaff } from '@/lib/email/templates'
import { site } from '@/lib/site'
import { siteUrl } from '@/lib/site-url'
import { CONTACT_TOPICS } from './topics'

export type ContactState = { ok?: boolean; error?: string; errors?: Record<string, string>; values?: Record<string, string> }

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(30).optional(),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], { message: 'Choose a topic' }),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(4000, 'Please keep it under 4,000 characters'),
})

export async function sendContactMessage(_: ContactState, fd: FormData): Promise<ContactState> {
  const values = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$'))) as Record<string, string>
  // Bots fill every field, including this hidden one.
  if (values.website) return { ok: true }
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return { errors, values }
  }
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  const ipHash = createHash('sha256').update(`ipcm:${ip}`).digest('hex').slice(0, 32)

  const admin = createAdminClient()
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin.from('contact_messages').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if ((count ?? 0) >= 5) return { error: 'You have sent several messages in the last hour. Please wait a little, or email us directly.', values }

  const d = parsed.data
  const { error } = await admin.from('contact_messages').insert({ name: d.name, email: d.email, phone: d.phone || null, topic: d.topic, message: d.message, ip_hash: ipHash })
  if (error) {
    console.error('[contact] insert failed', error.message)
    return { error: `We couldn’t send your message. Please try again, or email ${site.email.value}.`, values }
  }

  const topic = CONTACT_TOPICS.find((t) => t.value === d.topic)?.label ?? d.topic
  const ctx = { baseUrl: await siteUrl() }
  const inbox = process.env.CONTACT_INBOX || process.env.EMAIL_REPLY_TO || site.admissionsEmail.value
  after(async () => {
    await sendEmail({ ...contactToStaff(ctx, { ...d, topic }), to: inbox, replyTo: d.email, kind: 'contact_staff' })
    await sendEmail({ ...contactReceived(ctx, { name: d.name, topic }), to: d.email, kind: 'contact_ack' })
  })
  return { ok: true }
}
