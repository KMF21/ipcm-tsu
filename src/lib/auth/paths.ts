export const STAFF_ROLES = ['facilitator', 'editor', 'bursary', 'admissions', 'director', 'super_admin'] as const

export function isStaff(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** Where each role lands after signing in. */
export function homeForRole(role?: string | null) {
  return isStaff(role) ? '/admin' : '/portal'
}

/**
 * Only allow same-site relative paths as post-login destinations (prevents open redirects
 * such as ?next=https://evil.example or ?next=//evil.example).
 */
export function safeNext(next: string | null | undefined, fallback = '/portal') {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/^\/(login|register|forgot-password|reset-password|verify-email|auth)\b/.test(next)) return fallback
  return next
}
