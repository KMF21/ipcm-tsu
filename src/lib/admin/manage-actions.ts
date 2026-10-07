'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from './session'
import { can } from './roles'
import type { ActionState } from './actions'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date')
const cohortSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal('')),
    programme_id: z.string().uuid('Choose a programme'),
    name: z.string().trim().min(3, 'Give the intake a name, e.g. February 2027 cohort').max(80),
    start_date: date,
    end_date: date,
    application_deadline: date,
    capacity: z.coerce.number().int().min(1, 'At least 1 seat').max(500, 'At most 500 seats'),
    offer_expiry_days: z.coerce.number().int().min(1).max(60, 'At most 60 days'),
    venue: z.string().trim().max(160).optional(),
    status: z.enum(['draft', 'open', 'closed', 'running', 'completed']),
  })
  .refine((v) => v.end_date >= v.start_date, { message: 'The end date must be on or after the start date', path: ['end_date'] })
  .refine((v) => v.application_deadline <= v.start_date, { message: 'Applications must close on or before the start date', path: ['application_deadline'] })

export async function saveCohort(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff(can.manageIntakes)
  const parsed = cohortSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form.' }
  const { id, ...v } = parsed.data
  const row = { ...v, venue: v.venue || null }
  const { error } = id
    ? await supabase.from('cohorts').update(row).eq('id', id)
    : await supabase.from('cohorts').insert(row)
  if (error) {
    console.error('[admin] saveCohort', error.message)
    return { error: 'We couldn’t save this intake. Please try again.' }
  }
  revalidatePath('/admin/intakes')
  return { ok: true, message: id ? 'Intake updated.' : 'Intake created.' }
}

const naira = (max: number) =>
  z.preprocess((v) => String(v ?? '').replace(/[₦,\s]/g, ''), z.coerce.number().min(0, 'Amount cannot be negative').max(max, 'That amount is too large'))

const feeSchema = z.object({
  id: z.string().uuid(),
  base: naira(10_000_000),
  processing: naira(10_000),
})

export async function saveFee(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff(can.manageFees)
  const parsed = feeSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the amounts.' }
  const { id, base, processing } = parsed.data
  const { error } = await supabase
    .from('fee_items')
    .update({ base_amount_kobo: Math.round(base * 100), processing_fee_kobo: Math.round(processing * 100) })
    .eq('id', id)
  if (error) {
    console.error('[admin] saveFee', error.message)
    return { error: 'We couldn’t save this fee. Please try again.' }
  }
  revalidatePath('/admin/fees')
  return { ok: true, message: 'Fee saved. New payments use this amount.' }
}
