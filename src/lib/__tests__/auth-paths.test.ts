import { describe, expect, it } from 'vitest'
import { homeForRole, isStaff, safeNext } from '../auth/paths'

describe('safeNext', () => {
  it('keeps same-site paths', () => {
    expect(safeNext('/portal/apply?programme=NMA')).toBe('/portal/apply?programme=NMA')
  })
  it('blocks open redirects and auth loops', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'portal', '/login', '/auth/callback']) {
      expect(safeNext(bad, '/portal')).toBe('/portal')
    }
  })
})

describe('roles', () => {
  it('sends staff to admin and everyone else to the portal', () => {
    expect(homeForRole('director')).toBe('/admin')
    expect(homeForRole('student')).toBe('/portal')
    expect(homeForRole(undefined)).toBe('/portal')
    expect(isStaff('applicant')).toBe(false)
  })
})
