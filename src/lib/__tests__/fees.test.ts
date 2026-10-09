import { describe, expect, it } from 'vitest'
import { FEES, programmes } from '../programmes'
import { formatNaira, initials } from '../utils'

describe('fees', () => {
  it('charges ₦35,300 to apply and ₦100,300 tuition', () => {
    expect(formatNaira(FEES.application.base + FEES.application.processing)).toBe('₦35,300')
    expect(formatNaira(FEES.tuition.base + FEES.tuition.processing)).toBe('₦100,300')
  })
  it('stores amounts as whole kobo', () => {
    for (const f of Object.values(FEES)) {
      expect(Number.isInteger(f.base)).toBe(true)
      expect(Number.isInteger(f.processing)).toBe(true)
    }
  })
})

describe('programmes', () => {
  it('has the five approved programmes, each with 4 modules', () => {
    expect(programmes.map((p) => p.code)).toEqual(['PCM', 'NMA', 'CEW', 'PHR', 'PSS'])
    for (const p of programmes) expect(p.modules).toHaveLength(4)
  })
  it('has unique slugs', () => {
    expect(new Set(programmes.map((p) => p.slug)).size).toBe(programmes.length)
  })
})

describe('initials', () => {
  it('drops titles', () => {
    expect(initials('Dr. Musa Ibrahim')).toBe('MI')
    expect(initials('Amina Bello')).toBe('AB')
  })
})
