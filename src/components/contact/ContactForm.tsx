'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, Send } from 'lucide-react'
import { Alert, Button, Field, Input, Select, Textarea } from '@/components/ui'
import { sendContactMessage, type ContactState } from '@/lib/contact/actions'
import { CONTACT_TOPICS } from '@/lib/contact/topics'

function Submit() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">{pending ? 'Sending…' : <><Send className="h-5 w-5" aria-hidden /> Send message</>}</Button>
}

export function ContactForm({ topic }: { topic?: string }) {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, {})
  if (state.ok) {
    return (
      <div className="flex flex-col items-center rounded-card border border-success/30 bg-success-50 px-6 py-12 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
        <h3 className="mt-4 text-h3 font-semibold text-navy">Message sent</h3>
        <p className="mt-2 max-w-md text-base text-ink">Thank you. We reply within two working days. A copy has been sent to your email.</p>
      </div>
    )
  }
  const v = state.values ?? {}
  const e = state.errors ?? {}
  const preset = CONTACT_TOPICS.some((t) => t.value === topic) ? topic : ''
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="error" title={state.error} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-name" label="Your name" required error={e.name}>
          <Input id="c-name" name="name" autoComplete="name" defaultValue={v.name} invalid={!!e.name} aria-describedby={e.name ? 'c-name-error' : undefined} required />
        </Field>
        <Field id="c-email" label="Email" required error={e.email}>
          <Input id="c-email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={v.email} invalid={!!e.email} aria-describedby={e.email ? 'c-email-error' : undefined} required />
        </Field>
        <Field id="c-phone" label="Phone (optional)" error={e.phone}>
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={v.phone} />
        </Field>
        <Field id="c-topic" label="What is it about?" required error={e.topic}>
          <Select id="c-topic" name="topic" defaultValue={v.topic ?? preset} invalid={!!e.topic} required>
            <option value="" disabled>Choose a topic</option>
            {CONTACT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field id="c-message" label="Message" required error={e.message} hint="If it’s about an application or payment, include your application number (APP-…) or payment reference.">
        <Textarea id="c-message" name="message" defaultValue={v.message} invalid={!!e.message} rows={6} maxLength={4000} required />
      </Field>
      {/* Left empty by people; filled by spam bots */}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">We use your details only to reply. See our <a href="/privacy" className="font-semibold text-teal underline-offset-4 hover:underline">privacy policy</a>.</p>
        <Submit />
      </div>
    </form>
  )
}
