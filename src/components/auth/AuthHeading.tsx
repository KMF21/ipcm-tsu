export function AuthHeading({ title, intro }: { title: string; intro?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-[1.875rem] font-bold leading-[2.375rem] sm:text-h1">{title}</h1>
      {intro && <p className="mt-2 text-base text-ink-muted">{intro}</p>}
    </div>
  )
}
