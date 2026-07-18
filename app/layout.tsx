'use client'

import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
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
        <title>Atuswá Union - Management System</title>
        <meta name="description" content="Union Management System" />
      </head>
      <body className="antialiased bg-background">
        <ThemeProvider>
          <AuthProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
