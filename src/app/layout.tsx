import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/ui/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hearth',
  description: 'A small habit feed and a coach for everyday routines.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
