import { describe, expect, it } from 'vitest'
import { normaliseNigerianPhone, phoneSchema, signUpSchema } from '../validation/auth'

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
  const base = { firstName: 'Amina', surname: 'Bello', email: ' Amina@Example.com ', password: 'peace2027!', terms: 'on' }
  it('accepts valid input and normalises email', () => {
    const r = signUpSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('amina@example.com')
  })
  it('rejects short passwords and missing consent', () => {
    expect(signUpSchema.safeParse({ ...base, password: 'short' }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...base, terms: undefined }).success).toBe(false)
  })
  it('normalises phone numbers in the application form', () => {
    expect(phoneSchema.parse('0803 000 0000')).toBe('+2348030000000')
  })
})

describe('simple passwords', () => {
  it('accepts any 8+ characters, including a phone number', () => {
    const base = { firstName: 'Musa', surname: 'Ibrahim', email: 'musa@example.com', terms: 'on' }
    for (const password of ['08031234567', 'jalingo1', 'password']) {
      expect(signUpSchema.safeParse({ ...base, password }).success).toBe(true)
    }
  })
})
