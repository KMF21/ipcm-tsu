export function AuthHeading({ title, intro }: { title: string; intro?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[1.875rem] font-bold leading-[2.375rem] sm:text-h1">{title}</h1>
      {intro && <p className="mt-3 text-base text-ink-muted sm:text-lead">{intro}</p>}
    </div>
  )
}
