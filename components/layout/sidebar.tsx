'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LogOut } from 'lucide-react'
import { menuItems, cn } from '@/lib/constants'
import { getAccessesByRoleName } from "@/services/auth-services";
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [userAccesses, setUserAccesses] = useState<string[]>([])

  useEffect(() => {
    const fetchUserAccesses = async () => {
      if (user?.role) {
        try {
          const accesses = await getAccessesByRole(user?.role)
          if (accesses) {
            setUserAccesses(accesses)
          }

        } catch (error) {
          console.error('Error fetching user accesses:', error)
        }
      }
    }

    void fetchUserAccesses()
  }, [user?.role])

  const getAccessesByRole = async (roleName: string) => {
    if (!roleName) return []
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) return

    return await getAccessesByRoleName(supabase, session, roleName)
  }

  const visibleItems = menuItems.filter(item => userAccesses.includes(item.label))

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Tucoswa Union</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1">Management System</p>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-sidebar-foreground mb-1">Logged in as:</p>
          <p className="text-xs text-sidebar-foreground/70">{user?.role.toUpperCase()}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
