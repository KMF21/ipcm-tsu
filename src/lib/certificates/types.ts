/** What certificate_json() returns. Details are frozen at issue. */
export type Certificate = {
  id: string
  certificate_no: string
  verify_token: string
  issued_at: string
  holder_name: string
  programme_title: string
  cohort_name: string
  classification: 'Pass' | 'Distinction'
  revoked: boolean
  reg_no: string
  programme_code: string
  end_date: string
}

/** What verify_certificate_token() returns (public). */
export type CertificateCheck = {
  valid: boolean
  revoked_at: string | null
  certificate_no: string
  holder_name: string
  programme_title: string
  cohort_name: string
  classification: string | null
  issued_at: string
  reg_no: string
  replaced_by: string | null
}

/** What statement_json() / get_statement() return. */
export type Statement = {
  enrolment_id: string
  reg_no: string
  name: string
  programme_code: string
  programme_title: string
  cohort_name: string
  start_date: string
  end_date: string
  attendance_mode: 'off' | 'info' | 'required'
  attendance_waived: boolean
  attendance_pct: number | null
  total_pct: number | null
  classification: 'Pass' | 'Distinction' | 'Fail' | null
  published_at: string | null
  modules: { number: number; title: string; score: number | null }[]
  capstone: number | null
  certificate_no: string | null
  certificate_token: string | null
}

/** full: the whole certificate. qr: only the number and QR code, for the Institute's own printed paper. */
export type PrintMode = 'full' | 'qr'
export const printMode = (v: string | null): PrintMode => (v === 'full' ? 'full' : 'qr')

export const certificateVerifyPath = (token: string) => `/verify/certificate/${token}`
export const certificateFileName = (no: string, mode: PrintMode) => `${no}${mode === 'qr' ? '-number-and-QR' : ''}.pdf`
