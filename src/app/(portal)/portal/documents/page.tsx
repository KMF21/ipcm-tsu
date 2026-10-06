import { Construction } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Documents</h1>
      <EmptyState icon={<Construction className="h-7 w-7" />} title="Documents is on the way" body="This screen is built in Phase 2." action={<ButtonLink href="/portal">Back to dashboard</ButtonLink>} />
    </>
  )
}
