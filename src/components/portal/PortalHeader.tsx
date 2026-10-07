import type { ReactNode } from 'react'

export function PortalHeader({ eyebrow, title, intro, action }: { eyebrow?: string; title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-label font-semibold uppercase tracking-wide text-teal">{eyebrow}</p>}
        <h1 className="mt-1 text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-base text-ink-muted">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
