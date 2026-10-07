import { EmptyState, ButtonLink } from '@/components/ui'

export const metadata = { title: 'Apply' }

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Apply</h1>
      <EmptyState illustration title="The application form is on the way" body="Your account is ready. The step-by-step application form arrives in the next update." action={<ButtonLink href="/programmes">Browse programmes</ButtonLink>} />
    </>
  )
}
