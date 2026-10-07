'use client'

import { useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Alert, Button, Field, Input } from '@/components/ui'

export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <Alert tone="error" title={message} />
}

type TextFieldProps = {
  name: string
  label: string
  type?: string
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'text'
  placeholder?: string
  hint?: string
  error?: string
  defaultValue?: string
  required?: boolean
}

export function TextField({ name, label, type = 'text', autoComplete, inputMode, placeholder, hint, error, defaultValue, required = true }: TextFieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  return (
    <Field id={name} label={label} hint={hint} error={error} required={required}>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        invalid={!!error}
        aria-describedby={describedBy}
      />
    </Field>
  )
}

export function PasswordField({ name, label, autoComplete, hint, error }: { name: string; label: string; autoComplete: string; hint?: string; error?: string }) {
  const [show, setShow] = useState(false)
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  return (
    <Field id={name} label={label} hint={hint} error={error} required>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          invalid={!!error}
          aria-describedby={describedBy}
          className="pr-14"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-navy"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
    </Field>
  )
}
