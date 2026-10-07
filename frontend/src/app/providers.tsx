import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { callKeys } from '@/features/calls'
import { CallEventsProvider } from '@/features/realtime'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  )

  // Har bir SIP hodisasida qo'ng'iroqlar tarixi/statistikasi yangilanadi.
  const handleEvent = () => {
    void queryClient.invalidateQueries({ queryKey: callKeys.all })
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CallEventsProvider onEvent={handleEvent}>{children}</CallEventsProvider>
    </QueryClientProvider>
  )
}
