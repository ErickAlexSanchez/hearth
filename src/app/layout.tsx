import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { preferenceBootScript } from '@/ui/preference-boot'
import { SkipLink } from '@/ui/preferences'
import { Providers } from '@/ui/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hearth',
  description: 'A small habit feed and a coach for everyday routines.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="hearth-preferences" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
        <Providers>
          <SkipLink />
          {children}
        </Providers>
      </body>
    </html>
  )
}
