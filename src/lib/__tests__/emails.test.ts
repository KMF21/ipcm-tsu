import { describe, expect, it, vi } from 'vitest'
import * as T from '../email/templates'

vi.mock('server-only', () => ({}))
const ctx = { baseUrl: 'https://ipcm.tsucpgs.com.ng' }

describe('email templates', () => {
  it('escapes anything an applicant or staff member typed', () => {
    const e = T.changesRequested(ctx, { firstName: '<script>x</script>', items: [{ label: 'Photo', reason: 'Too dark <b>' }], note: 'a & b' })
    expect(e.html).not.toContain('<script>x')
    expect(e.html).toContain('&lt;script&gt;')
    expect(e.html).toContain('Too dark &lt;b&gt;')
    expect(e.html).toContain('a &amp; b')
  })
  it('includes the action link in both HTML and plain text', () => {
    const e = T.offerMade(ctx, { firstName: 'Amina', programme: 'PCM', cohort: 'Feb 2027', startDate: 'Saturday, 6 February 2027', payBy: '6 November 2026', amountKobo: 3_530_000 })
    expect(e.subject).toContain('Offer of admission')
    expect(e.html).toContain('https://ipcm.tsucpgs.com.ng/portal/apply/pay')
    expect(e.text).toContain('Pay tuition: https://ipcm.tsucpgs.com.ng/portal/apply/pay')
    expect(e.text).toContain('₦35,300')
    expect(e.text).not.toMatch(/<[a-z]/)
  })
  it('reminder wording matches the days left', () => {
    expect(T.offerReminder(ctx, { firstName: 'A', programme: 'P', payBy: 'x', daysLeft: 2, amountKobo: 1 }).subject).toBe('Reminder: your offer ends in 2 days')
    expect(T.offerReminder(ctx, { firstName: 'A', programme: 'P', payBy: 'x', daysLeft: 1, amountKobo: 1 }).subject).toBe('Reminder: your offer ends tomorrow')
  })
})
