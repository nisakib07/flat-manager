'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000, // 1 minute - prevent duplicate requests
        errorRetryCount: 2,
        errorRetryInterval: 5000,
        // Keep data in cache for 5 minutes
        focusThrottleInterval: 300000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
