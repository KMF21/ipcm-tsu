import { ButtonLink, EmptyState } from '@/components/ui'

/** Shown on student-only pages to applicants who are not admitted yet. */
export function NotYetStudent({ what }: { what: string }) {
  return (
    <EmptyState
      illustration
      title={`Your ${what} will appear here`}
      body="This page opens once you are admitted and your tuition is paid. Follow your application for the next step."
      action={<ButtonLink href="/portal/apply">Go to my application</ButtonLink>}
    />
  )
}
