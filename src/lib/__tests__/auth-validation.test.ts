import { describe, expect, it } from 'vitest'
import { normaliseNigerianPhone, signUpSchema } from '../validation/auth'

describe('normaliseNigerianPhone', () => {
  it('normalises common Nigerian formats', () => {
    for (const v of ['08030000000', '0803 000 0000', '+2348030000000', '2348030000000', '8030000000']) {
      expect(normaliseNigerianPhone(v)).toBe('+2348030000000')
    }
  })
  it('rejects invalid numbers', () => {
    expect(normaliseNigerianPhone('0603000000')).toBeNull()
    expect(normaliseNigerianPhone('12345')).toBeNull()
  })
})

describe('signUpSchema', () => {
  const base = { firstName: 'Amina', surname: 'Bello', email: ' Amina@Example.com ', phone: '0803 000 0000', password: 'peace2027!', confirmPassword: 'peace2027!', terms: 'on' }
  it('accepts valid input and normalises email and phone', () => {
    const r = signUpSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.email).toBe('amina@example.com')
      expect(r.data.phone).toBe('+2348030000000')
    }
  })
  it('rejects mismatched passwords', () => {
    expect(signUpSchema.safeParse({ ...base, confirmPassword: 'other' }).success).toBe(false)
  })
})
