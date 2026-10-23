'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { PreferencesProvider } from '@/ui/preferences'
import { createHearthStore, type HearthStore } from '@/ui/store'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5000,
        gcTime: process.env.NODE_ENV === 'test' ? Number.POSITIVE_INFINITY : 5 * 60 * 1000,
        networkMode: 'always',
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState<HearthStore>(() => createHearthStore())
  const [client] = useState(() => createQueryClient())
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <PreferencesProvider>{children}</PreferencesProvider>
      </QueryClientProvider>
    </Provider>
  )
}
