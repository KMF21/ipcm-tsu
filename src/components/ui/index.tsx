import Link from 'next/link'
import { forwardRef } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { cn, initials } from '@/lib/utils'

/* ---------- Button ---------- */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'light'
type ButtonSize = 'md' | 'lg'

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-white hover:bg-teal-700',
  secondary: 'border border-navy/25 bg-white text-navy hover:bg-navy hover:text-white',
  ghost: 'text-navy hover:bg-navy-50',
  destructive: 'bg-crimson text-white hover:bg-[#A81F30]',
  light: 'bg-white text-navy hover:bg-teal-50',
}
const buttonSizes: Record<ButtonSize, string> = { md: 'px-5 py-2.5 text-base', lg: 'px-7 py-3.5 text-base' }

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }
>(function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}

/* ---------- Badge / StatusPill ---------- */
type Tone = 'teal' | 'navy' | 'success' | 'amber' | 'crimson' | 'neutral'
const tones: Record<Tone, string> = {
  teal: 'bg-teal-50 text-teal-700',
  navy: 'bg-navy-50 text-navy',
  success: 'bg-success-50 text-success',
  amber: 'bg-amber-50 text-amber',
  crimson: 'bg-crimson-50 text-crimson',
  neutral: 'bg-canvas text-ink-muted border border-line',
}

export function Badge({ tone = 'teal', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

const statusMap: Record<string, { tone: Tone; label: string; Icon: typeof CheckCircle2 }> = {
  paid: { tone: 'success', label: 'Paid', Icon: CheckCircle2 },
  approved: { tone: 'success', label: 'Approved', Icon: CheckCircle2 },
  admitted: { tone: 'success', label: 'Admitted', Icon: CheckCircle2 },
  completed: { tone: 'success', label: 'Completed', Icon: CheckCircle2 },
  pending: { tone: 'amber', label: 'Pending', Icon: Info },
  under_review: { tone: 'amber', label: 'Under review', Icon: Info },
  in_progress: { tone: 'teal', label: 'In progress', Icon: Info },
  offered: { tone: 'teal', label: 'Offer made', Icon: Info },
  rejected: { tone: 'crimson', label: 'Rejected', Icon: XCircle },
  overdue: { tone: 'crimson', label: 'Overdue', Icon: AlertTriangle },
  not_started: { tone: 'neutral', label: 'Not started', Icon: Info },
}

/** Status is never colour alone: every pill carries an icon and a word. */
export function StatusPill({ status, label }: { status: keyof typeof statusMap | string; label?: string }) {
  const s = statusMap[status] ?? { tone: 'neutral' as Tone, label: status, Icon: Info }
  return (
    <Badge tone={s.tone}>
      <s.Icon className="h-4 w-4" aria-hidden />
      {label ?? s.label}
    </Badge>
  )
}

/* ---------- Card ---------- */
export function Card({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-card border border-line bg-white p-5 shadow-card sm:p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-h3 font-semibold">{title}</h3>
        {subtitle && <p className="mt-1 text-label text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- StatCard ---------- */
export function StatCard({
  icon,
  value,
  label,
  tone = 'teal',
  hint,
}: {
  icon: ReactNode
  value: string
  label: string
  tone?: 'teal' | 'navy' | 'amber' | 'crimson' | 'success'
  hint?: string
}) {
  const iconTone = {
    teal: 'bg-teal-50 text-teal',
    navy: 'bg-navy-50 text-navy',
    amber: 'bg-amber-50 text-amber',
    crimson: 'bg-crimson-50 text-crimson',
    success: 'bg-success-50 text-success',
  }[tone]
  return (
    <Card className="p-5">
      <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconTone)} aria-hidden>
        {icon}
      </span>
      <p className="mt-4 font-display text-stat font-bold text-navy">{value}</p>
      <p className="mt-1 text-label font-medium text-ink-muted">{label}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Card>
  )
}

/* ---------- ProgressBar ---------- */
export function ProgressBar({ value, label, tone = 'teal' }: { value: number; label: string; tone?: 'teal' | 'amber' | 'success' }) {
  const bar = { teal: 'bg-teal', amber: 'bg-amber', success: 'bg-success' }[tone]
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm font-medium text-ink-muted">
        <span>{label}</span>
        <span className="text-ink">{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn('h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ---------- Form fields ---------- */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-semibold text-ink">
        {label}
        {required && <span className="text-crimson"> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-ink-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-crimson" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

const inputBase =
  'w-full min-h-[48px] rounded-input border bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25 disabled:bg-canvas'

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'> & { invalid?: boolean }>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputBase, invalid ? 'border-crimson' : 'border-line', className)} aria-invalid={invalid || undefined} {...props} />
})

export function Select({ className, invalid, children, ...props }: ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <select className={cn(inputBase, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 fill=%27none%27 stroke=%27%234A5468%27 stroke-width=%272%27%3E%3Cpath d=%27m5 8 5 5 5-5%27/%3E%3C/svg%3E")] bg-[right_14px_center] bg-no-repeat pr-11', invalid ? 'border-crimson' : 'border-line', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, invalid, ...props }: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return <textarea className={cn(inputBase, 'min-h-[132px]', invalid ? 'border-crimson' : 'border-line', className)} {...props} />
}

/* ---------- FileUpload (presentational; wired to Supabase Storage in Phase 1) ---------- */
export function FileUploadBox({ label, accept, maxSize }: { label: string; accept: string; maxSize: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-canvas px-6 py-8 text-center transition-colors hover:border-teal">
      <UploadCloud className="h-9 w-9 text-teal" aria-hidden />
      <p className="text-base font-semibold text-navy">{label}</p>
      <p className="text-sm text-ink-muted">
        Tap to choose a file or drag it here · {accept} · max {maxSize}
      </p>
    </div>
  )
}

/* ---------- Alert ---------- */
export function Alert({ tone = 'info', title, children }: { tone?: 'info' | 'success' | 'warning' | 'error'; title: string; children?: ReactNode }) {
  const t = {
    info: { cls: 'border-teal/30 bg-teal-50', Icon: Info, ic: 'text-teal' },
    success: { cls: 'border-success/30 bg-success-50', Icon: CheckCircle2, ic: 'text-success' },
    warning: { cls: 'border-amber/30 bg-amber-50', Icon: AlertTriangle, ic: 'text-amber' },
    error: { cls: 'border-crimson/30 bg-crimson-50', Icon: XCircle, ic: 'text-crimson' },
  }[tone]
  return (
    <div className={cn('flex gap-3 rounded-card border p-4', t.cls)} role={tone === 'error' ? 'alert' : 'status'}>
      <t.Icon className={cn('mt-0.5 h-5 w-5 shrink-0', t.ic)} aria-hidden />
      <div>
        <p className="font-semibold text-navy">{title}</p>
        {children && <div className="mt-1 text-label text-ink">{children}</div>}
      </div>
    </div>
  )
}

/* ---------- Avatar (branded initials when no photo) ---------- */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-display font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.max(14, size * 0.36) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/* ---------- Stepper ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-start" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', done || active ? 'bg-teal' : 'bg-line')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold',
                done && 'border-teal bg-teal text-white',
                active && 'border-teal bg-white text-teal',
                !done && !active && 'border-line bg-white text-ink-muted',
              )}
            >
              {done ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : i + 1}
            </span>
            <span className={cn('mt-2 hidden text-sm font-medium sm:block', active ? 'text-navy' : 'text-ink-muted')}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Accordion (native details: accessible, no JS) ---------- */
export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-white">
      {items.map((it) => (
        <details key={it.q} className="group">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-navy [&::-webkit-details-marker]:hidden">
            {it.q}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg text-teal transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="px-5 pb-5 text-base text-ink">{it.a}</div>
        </details>
      ))}
    </div>
  )
}

/* ---------- EmptyState / Skeleton ---------- */
export function EmptyState({ icon, title, body, action, illustration }: { icon?: ReactNode; title: string; body: string; action?: ReactNode; illustration?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-white px-6 py-12 text-center">
      {illustration ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/placeholders/empty-state.jpg" alt="" width={160} height={160} className="h-40 w-40 object-contain" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal" aria-hidden>
          {icon}
        </span>
      )}
      <h3 className="mt-4 text-h3 font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-base text-ink-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-line/70', className)} aria-hidden />
}

/* ---------- Section heading ---------- */
export function SectionHeading({ eyebrow, title, intro, align = 'left' }: { eyebrow?: string; title: string; intro?: string; align?: 'left' | 'center' }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="text-label font-semibold uppercase tracking-[0.08em] text-teal">{eyebrow}</p>}
      <h2 className="mt-2 text-[1.5rem] font-semibold leading-8 sm:text-h2">{title}</h2>
      {intro && <p className="mt-4 text-base text-ink-muted sm:text-lead">{intro}</p>}
    </div>
  )
}

/** Amber tag shown on placeholder content outside production. */
export function PlaceholderTag({ show = true }: { show?: boolean }) {
  if (!show || process.env.NEXT_PUBLIC_APP_ENV === 'production') return null
  return <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 align-middle text-sm font-semibold text-amber">Placeholder</span>
}
