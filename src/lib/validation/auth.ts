import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')
const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer')

/** Accepts 0803..., 803..., +234803..., 234803... and normalises to +234XXXXXXXXXX. */
export function normaliseNigerianPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  const m = digits.match(/^(?:\+?234|0)?([789][01]\d{8})$/)
  return m ? `+234${m[1]}` : null
}

export const signUpSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name').max(60),
  surname: z.string().trim().min(2, 'Enter your surname').max(60),
  email,
  password,
  terms: z.literal('on', { message: 'Please accept the privacy notice to continue' }),
})

/** Phone is collected in the application form, where it is validated and normalised. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normaliseNigerianPhone(v)
    if (!n) ctx.addIssue({ code: 'custom', message: 'Enter a valid Nigerian phone number, e.g. 0803 000 0000' })
    return n ?? v
  })

export const signInSchema = z.object({ email, password: z.string().min(1, 'Enter your password') })

export const forgotSchema = z.object({ email })

export const resetSchema = z.object({ password })

export type FieldErrors = Partial<Record<string, string>>

export type FormState = {
  ok?: boolean
  message?: string
  errors?: FieldErrors
  values?: Record<string, string>
}

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

/** Only allow same-site relative redirects (prevents open-redirect attacks). */
export function safeNext(next: unknown, fallback = '/portal') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export const STAFF_ROLES = ['facilitator', 'editor', 'bursary', 'admissions', 'director', 'super_admin'] as const
