'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/confirm') return

    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    const roleName = user?.role.toLowerCase().replaceAll('_', ' ').trim()
    if (!isLoading && isAuthenticated && roleName === 'affiliate secretary' && pathname !== '/affiliate') {
      router.replace('/affiliate')
    }
    if (!isLoading && isAuthenticated && roleName === 'secretary general' && pathname === '/affiliate') {
      router.replace('/members')
    }
  }, [isLoading, isAuthenticated, pathname, router, user?.role])

  // Invitation confirmation is a standalone public page, not part of the app shell.
  if (pathname === '/confirm') {
    return <>{children}</>
  }

  if (!isLoading && isAuthenticated && user?.role.toLowerCase().replaceAll('_', ' ').trim() === 'affiliate secretary') {
    return <><main className="min-h-screen">{children}</main><Toaster richColors closeButton /></>
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Toaster richColors closeButton />
      </div>
    </div>
  )
}
