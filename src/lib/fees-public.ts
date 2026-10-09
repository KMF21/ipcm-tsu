import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { FEES } from '@/lib/programmes'

export type Fee = { base: number; processing: number }
export type PublicFees = {
  application: Fee
  tuition: Fee
  /** Per programme code, when a programme's fees differ from the usual ones. */
  byProgramme: Record<string, { application?: Fee; tuition?: Fee }>
}

export const feeTotal = (f: Fee) => f.base + f.processing

/** The most common amount across programmes, so one figure can be shown site-wide. */
function usual(list: Fee[], fallback: Fee): Fee {
  if (!list.length) return fallback
  const counts = new Map<string, { f: Fee; n: number }>()
  for (const f of list) {
    const k = `${f.base}:${f.processing}`
    counts.set(k, { f, n: (counts.get(k)?.n ?? 0) + 1 })
  }
  return [...counts.values()].sort((a, b) => b.n - a.n)[0].f
}

/**
 * Fees as set under Admin → Fees: the same amounts the portal charges through Paystack.
 * Falls back to the standard fees if the database can't be reached.
 */
export const getPublicFees = cache(async (): Promise<PublicFees> => {
  const fallback: PublicFees = { application: FEES.application, tuition: FEES.tuition, byProgramme: {} }
  const db = createPublicClient()
  if (!db) return fallback
  try {
    const { data, error } = await db
      .from('fee_items')
      .select('type, base_amount_kobo, processing_fee_kobo, programmes!inner(code, is_published)')
      .eq('active', true)
      .in('type', ['application', 'tuition'])
    if (error || !data) return fallback
    type Row = { type: 'application' | 'tuition'; base_amount_kobo: number; processing_fee_kobo: number; programmes: { code: string; is_published: boolean } }
    const rows = (data as unknown as Row[]).filter((r) => r.programmes?.is_published !== false)
    const pick = (t: Row['type']) => rows.filter((r) => r.type === t).map((r) => ({ base: r.base_amount_kobo, processing: r.processing_fee_kobo }))
    const out: PublicFees = { application: usual(pick('application'), FEES.application), tuition: usual(pick('tuition'), FEES.tuition), byProgramme: {} }
    for (const r of rows) {
      (out.byProgramme[r.programmes.code] ??= {})[r.type] = { base: r.base_amount_kobo, processing: r.processing_fee_kobo }
    }
    return out
  } catch (e) {
    console.error('[fees] public fees', e)
    return fallback
  }
})

/** A programme's own fees, or the usual ones. */
export function programmeFees(fees: PublicFees, code: string) {
  const own = fees.byProgramme[code] ?? {}
  return { application: own.application ?? fees.application, tuition: own.tuition ?? fees.tuition }
}
