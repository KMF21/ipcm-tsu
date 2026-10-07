import { z } from 'zod'
import { phoneSchema } from '@/lib/validation/auth'

export const STEPS = [
  { n: 1, key: 'programme', title: 'Programme', heading: 'Choose your programme' },
  { n: 2, key: 'personal', title: 'Personal', heading: 'Personal details' },
  { n: 3, key: 'professional', title: 'Work', heading: 'Your work and experience' },
  { n: 4, key: 'qualifications', title: 'Education', heading: 'Education and qualifications' },
  { n: 5, key: 'sponsorship', title: 'Sponsorship', heading: 'Who is paying?' },
  { n: 6, key: 'documents', title: 'Documents', heading: 'Upload your documents' },
  { n: 7, key: 'statement', title: 'Statement', heading: 'Why this programme?' },
  { n: 8, key: 'review', title: 'Review', heading: 'Review and submit' },
] as const

export type StepKey = (typeof STEPS)[number]['key']
export const LAST_STEP = STEPS.length

export const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Barr', 'Engr', 'Rev', 'Alhaji', 'Hajiya', 'Chief', 'HRH']
export const SECTORS = [
  ['security', 'Security agency (Police, NSCDC, Military, DSS, etc.)'],
  ['public_service', 'Public or civil service / local government'],
  ['traditional_religious', 'Traditional or religious leadership'],
  ['ngo', 'NGO, humanitarian or community organisation'],
  ['legal', 'Legal profession'],
  ['media', 'Media and communications'],
  ['education', 'Education'],
  ['private', 'Private sector / business'],
  ['student', 'Student'],
  ['other', 'Other'],
] as const
export const EMPLOYMENT = [
  ['employed', 'Employed'],
  ['self_employed', 'Self-employed'],
  ['unemployed', 'Not currently employed'],
  ['student', 'Student'],
  ['retired', 'Retired'],
] as const
export const QUALIFICATIONS = ['SSCE / WASSCE / NECO', 'OND / NCE', 'HND', 'Bachelor’s degree', 'PGD', 'Master’s degree', 'PhD', 'Other']
export const OLEVEL_TYPES = ['WASSCE', 'NECO', 'NABTEB', 'GCE', 'Other', 'None']

const thisYear = new Date().getFullYear()
const req = (msg: string) => z.string().trim().min(1, msg)
const optional = z.string().trim().optional().transform((v) => v || undefined)

export const schemas = {
  programme: z.object({
    programme: z.string().regex(/^[A-Z]{2,5}$/, 'Choose a programme'),
    cohort_id: z.string().uuid('Choose an intake'),
  }),
  personal: z.object({
    title: req('Choose a title'),
    surname: z.string().trim().min(2, 'Enter your surname').max(60),
    first_name: z.string().trim().min(2, 'Enter your first name').max(60),
    other_names: optional,
    sex: z.enum(['female', 'male'], { message: 'Choose one' }),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth')
      .refine((d) => {
        const age = ageOn(d)
        return age >= 16 && age <= 100
      }, 'Check your date of birth'),
    phone: phoneSchema,
    // "outside" = lives or comes from outside Nigeria: no state or LGA needed.
    state_id: z
      .string({ message: 'Choose your state' })
      .trim()
      .min(1, 'Choose your state')
      .transform((v) => (v === 'outside' ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v > 0), 'Choose your state'),
    lga_id: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? Number(v) : null)),
    address: z.string().trim().min(5, 'Enter your residential address').max(300),
  }).refine((d) => d.state_id === null || (Number.isInteger(d.lga_id) && (d.lga_id ?? 0) > 0), { path: ['lga_id'], message: 'Choose your LGA' }),
  professional: z
    .object({
      employment_status: z.enum(EMPLOYMENT.map(([v]) => v) as [string, ...string[]], { message: 'Choose one' }),
      sector: z.enum(SECTORS.map(([v]) => v) as [string, ...string[]], { message: 'Choose your sector' }),
      organisation: optional,
      job_role: optional,
      years_experience: z.coerce.number({ message: 'Enter a number' }).int().min(0, 'Enter 0 or more').max(60, 'Check this number'),
    })
    .refine((d) => !['employed', 'self_employed'].includes(d.employment_status) || !!d.organisation, {
      path: ['organisation'],
      message: 'Enter your organisation',
    }),
  qualifications: z.object({
    highest_qualification: req('Choose your highest qualification'),
    institution: z.string().trim().min(2, 'Enter the institution').max(160),
    year: z.coerce.number({ message: 'Enter a year' }).int().min(1960, 'Check the year').max(thisYear, 'Check the year'),
    olevel_type: z.enum(OLEVEL_TYPES as [string, ...string[]], { message: 'Choose one' }),
    olevel_year: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .refine((v) => v === undefined || (Number.isInteger(v) && v >= 1960 && v <= thisYear), 'Check the year'),
    is_mature_entry: z
      .string()
      .optional()
      .transform((v) => v === 'on'),
  }),
  sponsorship: z
    .object({
      sponsored: z.enum(['no', 'yes'], { message: 'Choose one' }),
      sponsor_organisation: optional,
      sponsor_contact_name: optional,
      sponsor_contact_phone: optional,
      sponsor_contact_email: z
        .string()
        .trim()
        .optional()
        .transform((v) => v || undefined)
        .refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email'),
    })
    .refine((d) => d.sponsored === 'no' || !!d.sponsor_organisation, { path: ['sponsor_organisation'], message: 'Enter the organisation' })
    .refine((d) => d.sponsored === 'no' || !!d.sponsor_contact_name, { path: ['sponsor_contact_name'], message: 'Enter a contact person' }),
  statement: z.object({
    statement: z
      .string()
      .trim()
      .refine((s) => wordCount(s) >= 30, 'Write at least 30 words (a few sentences)')
      .refine((s) => wordCount(s) <= 400, 'Keep it to 400 words or fewer'),
  }),
  review: z.object({
    declaration: z.literal('on', { message: 'Please confirm the declaration to continue' }),
  }),
} as const

export function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export function ageOn(dob: string, at = new Date()) {
  const d = new Date(dob + 'T00:00:00')
  let age = at.getFullYear() - d.getFullYear()
  const m = at.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && at.getDate() < d.getDate())) age--
  return age
}

/* ---------- Documents ---------- */
export type DocType = 'passport_photo' | 'qualification' | 'identification' | 'cv' | 'sponsorship_letter'

export const DOC_RULES: Record<DocType, { label: string; help: string; mimes: string[]; maxBytes: number; max: number }> = {
  passport_photo: { label: 'Passport photograph', help: 'A recent, clear photo of your face. We crop and resize it for you.', mimes: ['image/jpeg', 'image/png'], maxBytes: 4 * 1024 * 1024, max: 1 },
  qualification: { label: 'O’Level result or highest qualification', help: 'A PDF, or a clear photo of the whole certificate or result. Up to 3 files.', mimes: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 4 * 1024 * 1024, max: 3 },
  identification: { label: 'Means of identification (optional)', help: 'If you have one: voter’s card, international passport, driver’s licence or staff ID.', mimes: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 4 * 1024 * 1024, max: 1 },
  cv: { label: 'CV or evidence of experience', help: 'For mature entry: anything that shows at least 2 years of relevant work. A letter or a photo is fine.', mimes: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 4 * 1024 * 1024, max: 1 },
  sponsorship_letter: { label: 'Sponsorship or nomination letter', help: 'From your organisation. A PDF or a clear photo of the signed letter.', mimes: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 4 * 1024 * 1024, max: 1 },
}

export function requiredDocs(stepData: StepData): DocType[] {
  const docs: DocType[] = ['passport_photo', 'qualification']
  if (stepData.qualifications?.is_mature_entry) docs.push('cv')
  if (stepData.sponsorship?.sponsored === 'yes') docs.push('sponsorship_letter')
  return docs
}

/** Checks a file's first bytes, not its name: a renamed file can't pass as a PDF or image. */
export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return 'application/pdf'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  return null
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

/* ---------- Saved data shape ---------- */
export type StepData = {
  completed?: number[]
  programme?: z.infer<typeof schemas.programme>
  personal?: z.infer<typeof schemas.personal>
  professional?: z.infer<typeof schemas.professional>
  qualifications?: z.infer<typeof schemas.qualifications>
  sponsorship?: z.infer<typeof schemas.sponsorship>
  statement?: z.infer<typeof schemas.statement>
  review?: { declaration: 'on'; declared_at: string }
}

/** The furthest step an applicant may open: one past their last completed step. */
export function furthestStep(data: StepData) {
  const done = new Set(data.completed ?? [])
  let n = 1
  while (done.has(n) && n < LAST_STEP) n++
  return n
}
