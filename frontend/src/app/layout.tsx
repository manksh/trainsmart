import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CTLST Labs - Mental Performance Training',
  description: 'Mental performance training application for athletes',
  manifest: '/manifest.json',
  themeColor: '#4a7c59',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CTLST Labs',
  },
}

// Separate viewport export (Next.js 14 pattern)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
