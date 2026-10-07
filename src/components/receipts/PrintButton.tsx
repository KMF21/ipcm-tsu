'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui'

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" size="lg" onClick={() => window.print()} className="w-full sm:w-auto">
      <Printer className="h-5 w-5" aria-hidden /> Print
    </Button>
  )
}
