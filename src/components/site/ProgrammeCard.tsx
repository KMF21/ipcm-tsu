import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Wallet } from 'lucide-react'
import { images } from '@/lib/images'
import { FEES, FORMAT, type Programme } from '@/lib/programmes'
import { formatNaira } from '@/lib/utils'

export function ProgrammeCard({ p, tuition = FEES.tuition.base }: { p: Programme; tuition?: number }) {
  const img = images.programmes[p.code]
  return (
    <Link
      href={`/programmes/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-raised"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={img.src} alt={img.alt} fill sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        <span className="absolute left-4 top-4 rounded-md bg-white px-2.5 py-1 font-display text-sm font-bold text-navy shadow-card">{p.code}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-h3 font-semibold leading-snug">{p.shortTitle}</h3>
        <p className="mt-3 flex-1 text-base text-ink-muted">{p.promise}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-label text-ink">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-[18px] w-[18px] text-teal" aria-hidden /> {FORMAT.durationWeeks} weeks · Saturdays</span>
          <span className="flex items-center gap-1.5"><Wallet className="h-[18px] w-[18px] text-teal" aria-hidden /> {formatNaira(tuition)} tuition</span>
        </div>
        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-teal">
          Learn more <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
