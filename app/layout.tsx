'use client'

import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { useEffect } from 'react'
import { initializeDummyData } from '@/lib/dummy-data'

// Note: Cannot export metadata in Client Components
// Moving to separate root layout if needed

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    initializeDummyData()
  }, [])

  return (
    <html lang="en" className="bg-background">
      <head>
        <title>TUCOSWA - Management System</title>
        <link rel="icon" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Union Management System" />
      </head>
      <body className="antialiased bg-background">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
