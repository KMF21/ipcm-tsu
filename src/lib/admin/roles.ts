export type Role = 'applicant' | 'student' | 'facilitator' | 'editor' | 'bursary' | 'admissions' | 'director' | 'super_admin'

export const ROLE_LABEL: Record<Role, string> = {
  applicant: 'Applicant',
  student: 'Student',
  facilitator: 'Facilitator',
  editor: 'Content editor',
  bursary: 'Bursary',
  admissions: 'Admissions',
  director: 'Director',
  super_admin: 'Super admin',
}

const any = (roles: Role[]) => (r?: string | null) => !!r && (roles as string[]).includes(r)

/** What each staff role may do. Mirrors the database rules (RLS and staff_* functions). */
export const can = {
  review: any(['admissions', 'director', 'super_admin']),
  money: any(['bursary', 'director', 'super_admin']),
  manageIntakes: any(['director', 'super_admin']),
  manageFees: any(['bursary', 'director', 'super_admin']),
  helpApplicants: any(['admissions', 'director', 'super_admin']),
  seeIntakes: any(['admissions', 'bursary', 'director', 'super_admin']),
}
