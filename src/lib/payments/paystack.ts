import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const BASE = 'https://api.paystack.co'

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

export type PaystackTransaction = {
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending' | 'processing' | 'queued' | 'reversed'
  reference: string
  amount: number // kobo
  currency: string
  channel?: string
  paid_at?: string | null
  gateway_response?: string
  customer?: { email?: string }
  metadata?: Record<string, unknown> | string | null
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T }
  if (!res.ok || !body.status || !body.data) throw new Error(`Paystack ${path} failed: ${res.status} ${body.message ?? ''}`.trim())
  return body.data
}

/** Starts a hosted checkout. The amount passed here must come from the database, never the browser. */
export function initializeTransaction(input: { email: string; amountKobo: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: 'NGN',
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      metadata: input.metadata,
    }),
  })
}

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
export function isValidSignature(rawBody: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY) {
  if (!signature || !key) return false
  const expected = createHmac('sha512', key).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
