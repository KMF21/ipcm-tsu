import { Construction } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="container-page py-20">
      <h1 className="sr-only">{title}</h1>
      <EmptyState
        icon={<Construction className="h-7 w-7" />}
        title={`${title} is on the way`}
        body={`This page is built in ${phase}. The homepage, programme pages and student dashboard are ready to review now.`}
        action={<ButtonLink href="/">Back to homepage</ButtonLink>}
      />
    </div>
  )
}
