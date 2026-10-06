import { Compass } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <main id="main" className="container-page py-24">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState icon={<Compass className="h-7 w-7" />} title="We couldn’t find that page" body="It may have moved, or the link may be mistyped." action={<ButtonLink href="/">Go to the homepage</ButtonLink>} />
    </main>
  )
}
