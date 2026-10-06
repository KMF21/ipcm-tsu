import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Amounts are stored in kobo. ₦15,300 = 1_530_000 kobo. */
export function formatNaira(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function initials(name: string) {
  return name
    .replace(/^(Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
