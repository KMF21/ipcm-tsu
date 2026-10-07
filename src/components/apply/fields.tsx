'use client'

import { useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { Alert, Button, Field, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { wordCount } from '@/lib/application/steps'

const describedBy = (name: string, error?: string, hint?: string) => (error ? `${name}-error` : hint ? `${name}-hint` : undefined)

export function TextInput(props: {
  name: string
  label: string
  defaultValue?: string | number
  error?: string
  hint?: string
  type?: string
  inputMode?: 'text' | 'tel' | 'numeric' | 'email'
  autoComplete?: string
  placeholder?: string
  required?: boolean
  max?: string
}) {
  const { name, label, error, hint, required = true } = props
  return (
    <Field id={name} label={label} error={error} hint={hint} required={required}>
      <Input
        id={name}
        name={name}
        type={props.type ?? 'text'}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue ?? ''}
        max={props.max}
        invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        aria-required={required}
      />
    </Field>
  )
}

export function SelectInput({
  name,
  label,
  options,
  defaultValue,
  error,
  hint,
  required = true,
  placeholder = 'Select one',
  onChange,
  value,
  disabled,
}: {
  name: string
  label: string
  options: readonly (readonly [string, string])[] | string[]
  defaultValue?: string | number
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  onChange?: (v: string) => void
  value?: string
  disabled?: boolean
}) {
  const opts = (options as (readonly [string, string] | string)[]).map((o) => (typeof o === 'string' ? ([o, o] as const) : o))
  const controlled = value !== undefined
  return (
    <Field id={name} label={label} error={error} hint={hint} required={required}>
      <Select
        id={name}
        name={name}
        {...(controlled ? { value } : { defaultValue: defaultValue !== undefined ? String(defaultValue) : '' })}
        onChange={(e) => onChange?.(e.target.value)}
        invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </Field>
  )
}

export function RadioCards({
  name,
  label,
  options,
  defaultValue,
  error,
  onChange,
  columns = 2,
}: {
  name: string
  label: string
  options: { value: string; label: string; description?: string }[]
  defaultValue?: string
  error?: string
  onChange?: (v: string) => void
  columns?: 1 | 2
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-label font-semibold text-ink">
        {label} <span className="text-crimson">*</span>
      </legend>
      <div className={cn('mt-2 grid gap-3', columns === 2 && 'sm:grid-cols-2')}>
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-[56px] cursor-pointer items-start gap-3 rounded-card border border-line bg-white p-4 transition has-[:checked]:border-teal has-[:checked]:bg-teal-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal/40"
          >
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} onChange={() => onChange?.(o.value)} className="mt-1 h-5 w-5 shrink-0 accent-teal" />
            <span>
              <span className="block font-semibold text-navy">{o.label}</span>
              {o.description && <span className="mt-0.5 block text-sm text-ink-muted">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm font-medium text-crimson" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

export function CheckboxField({ name, label, defaultChecked, error, children }: { name: string; label: ReactNode; defaultChecked?: boolean; error?: string; children?: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-line p-4 has-[:checked]:border-teal has-[:checked]:bg-teal-50">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 shrink-0 accent-teal" aria-invalid={!!error || undefined} />
        <span className="text-base text-ink">
          <span className="font-semibold text-navy">{label}</span>
          {children && <span className="mt-1 block text-sm text-ink-muted">{children}</span>}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm font-medium text-crimson" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function WordCountTextarea({ name, label, defaultValue, error, min, max, hint }: { name: string; label: string; defaultValue?: string; error?: string; min: number; max: number; hint?: string }) {
  const [text, setText] = useState(defaultValue ?? '')
  const n = wordCount(text)
  const ok = n >= min && n <= max
  return (
    <Field id={name} label={label} error={error} hint={hint} required>
      <Textarea id={name} name={name} value={text} onChange={(e) => setText(e.target.value)} invalid={!!error} rows={10} className="min-h-[240px]" aria-describedby={`${name}-count`} />
      <p id={`${name}-count`} className={cn('text-sm font-medium', ok ? 'text-success' : 'text-ink-muted')} aria-live="polite">
        {n} words · {min} to {max} required
      </p>
    </Field>
  )
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null
  return <Alert tone="error" title={message} />
}

function NavButton({ intent, children, variant, icon }: { intent: string; children: ReactNode; variant: 'primary' | 'secondary' | 'ghost'; icon?: ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" name="intent" value={intent} variant={variant} size="lg" disabled={pending} className="w-full sm:w-auto">
      {icon}
      {children}
    </Button>
  )
}

/** Back · Save and exit · Continue. Every button saves what's on the page. */
export function StepNav({ step, continueLabel = 'Save and continue', hideBack }: { step: number; continueLabel?: string; hideBack?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {!hideBack && step > 1 && <NavButton intent="back" variant="ghost" icon={<ArrowLeft className="h-5 w-5" aria-hidden />}>Back</NavButton>}
        <NavButton intent="exit" variant="secondary" icon={<Save className="h-5 w-5" aria-hidden />}>Save and exit</NavButton>
      </div>
      <Button type="submit" name="intent" value="next" size="lg" loading={pending} className="w-full sm:w-auto">
        {pending ? 'Saving…' : continueLabel}
        {!pending && <ArrowRight className="h-5 w-5" aria-hidden />}
      </Button>
    </div>
  )
}
