import { MessageCircle } from 'lucide-react'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

/** Opens WhatsApp to the admissions line with a ready-made message. */
export function WhatsAppButton({ text, label = 'Chat with admissions on WhatsApp', className }: { text: string; label?: string; className?: string }) {
  const number = site.whatsapp.value.replace(/[^\d]/g, '')
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#1F8F4E] px-6 py-3 text-base font-semibold text-white hover:bg-[#18743F]', className)}
    >
      <MessageCircle className="h-5 w-5" aria-hidden /> {label}
    </a>
  )
}
