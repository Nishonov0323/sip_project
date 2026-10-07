import { useEffect, useState } from 'react'

/** `since` (ISO) dan beri o'tgan soniyalar, har soniyada yangilanadi. */
export function useElapsed(since: string | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!since) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [since])

  return since ? Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000)) : 0
}
