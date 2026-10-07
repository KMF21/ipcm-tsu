import { ButtonLink, EmptyState } from '@/components/ui'

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Results</h1>
      <EmptyState illustration title="Results is on the way" body="This screen is built in Phase 2." action={<ButtonLink href="/portal">Back to dashboard</ButtonLink>} />
    </>
  )
}
