'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/** A calm notice when the network drops, common on mobile data, instead of a confusing error. */
export function OfflineNotice() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber px-4 py-2.5 text-center text-sm font-semibold text-white print:hidden">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      You’re offline. What you’ve saved is safe; this page will work again when your connection returns.
    </div>
  )
}
