'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  Briefcase,
  Calendar,
  LifeBuoy,
  FileText,
  Settings,
  Building2,
  Users2,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.TREASURER, UserRole.PROJECT_COORDINATOR, UserRole.EVENTS_MANAGER]
    },
    {
      label: 'Branches',
      href: '/branches',
      icon: Building2,
      roles: [UserRole.SECRETARY_GENERAL]
    },
    {
      label: 'Board Members',
      href: '/board',
      icon: UserCog,
      roles: [UserRole.SECRETARY_GENERAL]
    },
    {
      label: 'NEC Members',
      href: '/members',
      icon: Users,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN]
    },
    {
      label: 'Financial',
      href: '/financial',
      icon: DollarSign,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.TREASURER]
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: Briefcase,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.PROJECT_COORDINATOR]
    },
    {
      label: 'Events',
      href: '/events',
      icon: Calendar,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.EVENTS_MANAGER, UserRole.BRANCH_ADMIN]
    },
    {
      label: 'Grievances',
      href: '/helpdesk',
      icon: LifeBuoy,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.TREASURER]
    },
    {
      label: 'E-Filing',
      href: '/e-filing',
      icon: FileText,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.PROJECT_COORDINATOR]
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.TREASURER, UserRole.PROJECT_COORDINATOR, UserRole.EVENTS_MANAGER]
    }
  ]

  const visibleItems = menuItems.filter(item => !user || item.roles.includes(user.role))

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Atuswá Union</h1>
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
          <p className="text-sm text-sidebar-foreground font-medium truncate">{user?.name}</p>
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
