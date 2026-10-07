import { describe, expect, it } from 'vitest'
import { ageOn, furthestStep, requiredDocs, schemas, sniffMime, wordCount } from '../application/steps'

describe('wizard rules', () => {
  it('lets applicants open only one step past their last completed step', () => {
    expect(furthestStep({})).toBe(1)
    expect(furthestStep({ completed: [1, 2] })).toBe(3)
    expect(furthestStep({ completed: [1, 3] })).toBe(2)
  })
  it('requires CV for mature entry and a letter when sponsored', () => {
    expect(requiredDocs({})).toEqual(['passport_photo', 'qualification', 'identification'])
    expect(requiredDocs({ qualifications: { is_mature_entry: true } as never, sponsorship: { sponsored: 'yes' } as never })).toContain('cv')
    expect(requiredDocs({ sponsorship: { sponsored: 'yes' } as never })).toContain('sponsorship_letter')
  })
  it('checks statement length by words', () => {
    expect(wordCount('one two  three')).toBe(3)
    expect(schemas.statement.safeParse({ statement: 'word '.repeat(99) }).success).toBe(false)
    expect(schemas.statement.safeParse({ statement: 'word '.repeat(150) }).success).toBe(true)
  })
  it('validates personal details and normalises phone', () => {
    const r = schemas.personal.safeParse({ title: 'Mrs', surname: 'Bello', first_name: 'Amina', sex: 'female', dob: '1985-04-12', phone: '0803 000 0000', state_id: '35', lga_id: '1006', address: 'Mile Six, Jalingo', nin: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBe('+2348030000000')
    expect(schemas.personal.safeParse({ title: 'Mr', surname: 'X', first_name: 'Y', sex: 'male', dob: '2020-01-01', phone: '1', state_id: '', lga_id: '', address: '' }).success).toBe(false)
  })
  it('requires an organisation when employed', () => {
    expect(schemas.professional.safeParse({ employment_status: 'employed', sector: 'security', years_experience: '5' }).success).toBe(false)
    expect(schemas.professional.safeParse({ employment_status: 'unemployed', sector: 'other', years_experience: '0' }).success).toBe(true)
  })
  it('computes age correctly around birthdays', () => {
    expect(ageOn('2000-06-15', new Date('2025-06-14'))).toBe(24)
    expect(ageOn('2000-06-15', new Date('2025-06-15'))).toBe(25)
  })
  it('recognises real file types from their bytes', () => {
    expect(sniffMime(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe('application/pdf')
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(sniffMime(new TextEncoder().encode('MZ fake exe renamed.pdf'))).toBeNull()
  })
})
