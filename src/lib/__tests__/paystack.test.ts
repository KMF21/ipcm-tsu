import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const { isValidSignature } = await import('../payments/paystack')

describe('Paystack webhook signature', () => {
  const key = 'sk_test_example'
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'IPCM-APP-abc', amount: 1530000 } })
  const good = createHmac('sha512', key).update(body).digest('hex')
  it('accepts a correctly signed body', () => {
    expect(isValidSignature(body, good, key)).toBe(true)
  })
  it('rejects a tampered body or wrong signature', () => {
    expect(isValidSignature(body.replace('1530000', '100'), good, key)).toBe(false)
    expect(isValidSignature(body, 'deadbeef', key)).toBe(false)
    expect(isValidSignature(body, null, key)).toBe(false)
  })
})
