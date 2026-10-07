/** What letter_json() / get_admission_letter() return. */
export type AdmissionLetter = {
  application_id: string
  application_ref: string
  reg_no: string
  letter_token: string
  admitted_at: string
  enrolment_status: string
  name: string
  first_name: string
  email: string
  address: string | null
  programme_code: string
  programme_title: string
  cohort_name: string
  start_date: string
  end_date: string
  venue: string | null
}

export type LetterCheck = {
  valid: boolean
  status: string
  reg_no: string
  admitted_at: string
  name: string
  programme_code: string
  programme_title: string
  cohort_name: string
  start_date: string
}

export const letterVerifyPath = (token: string) => `/verify/letter/${token}`

export function longDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: undefined, day: 'numeric', month: 'long', year: 'numeric' })
}

export function weekdayDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
