import { afterEach, describe, expect, it, vi } from 'vitest'
import { appStatus, daysUntil, isLapsed, lastPayDay } from '../admin/status'
import { can } from '../admin/roles'
import { cleanSearch } from '../admin/queries-clean'

// An offer made on 7 Oct for 30 days expires at midnight (Lagos) at the end of 6 Nov: 2026-11-06T23:00:00Z.
const EXPIRES = '2026-11-06T23:00:00Z'

afterEach(() => vi.useRealTimers())

describe('offer timing', () => {
  it('names the last day to pay in Nigerian time', () => {
    expect(lastPayDay(EXPIRES)).toBe('6 November 2026')
  })
  it('counts days left', () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T09:00:00Z') })
    expect(daysUntil(EXPIRES)).toBe(30)
    vi.setSystemTime(new Date('2026-11-06T20:00:00Z'))
    expect(daysUntil(EXPIRES)).toBe(0)
    expect(isLapsed('offered', EXPIRES)).toBe(false)
  })
  it('lapses after the last day', () => {
    vi.useFakeTimers({ now: new Date('2026-11-06T23:00:01Z') })
    expect(isLapsed('offered', EXPIRES)).toBe(true)
    expect(appStatus('offered', EXPIRES).label).toBe('Offer lapsed')
  })
})

describe('staff permissions', () => {
  it('limits each area to the right roles', () => {
    expect(can.review('admissions')).toBe(true)
    expect(can.review('bursary')).toBe(false)
    expect(can.money('bursary')).toBe(true)
    expect(can.money('admissions')).toBe(false)
    expect(can.manageIntakes('admissions')).toBe(false)
    expect(can.manageIntakes('director')).toBe(true)
    expect(can.helpApplicants('super_admin')).toBe(true)
    expect(can.review('applicant')).toBe(false)
  })
})

describe('search text', () => {
  it('strips characters that could change a database filter', () => {
    expect(cleanSearch('amina),role.eq.super_admin')).toBe('amina role.eq.super_admin')
    expect(cleanSearch("o'neil%*")).toBe('o neil')
  })
})
