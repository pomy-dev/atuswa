import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
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
} from 'lucide-react'
import { Role } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function canSee(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export const formatLabel = (value: string | null | undefined) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .split(' ') // Split by spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const permissions: Record<string, string> = {
  'read': 'Read',
  'write': 'Write',
  'delete': 'Delete',
  'activate': 'Activate',
  'deactivate': 'Deactivate',
  'archive': 'Archive',
  'import': 'Import',
  'export': 'Export',
  'generate.reports': 'Generate Reports',
  'configure.users': 'Configure Users',
  'configure.roles': 'Configure Roles',
  'settings.edit': 'Edit Settings',
  'transfers': 'Transfers',
}

export const getRoleAccesses = (role: Role): string[] => {

  const accesses = (role.accesses ?? []).map((access: any) =>
    typeof access === "string"
      ? access
      : access.access_value
  );

  const menuItemLabels = menuItems.map((item) => item.label);

  const roleAccesses = menuItemLabels.filter((label) =>
    accesses.includes(label)
  );

  return roleAccesses;
};

export const menuItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Branches',
    href: '/branches',
    icon: Building2,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Users',
    href: '/board',
    icon: UserCog,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Tucoswa Affiliates',
    href: '/members',
    icon: Users,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Financial',
    href: '/financial',
    icon: DollarSign,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: Briefcase,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Events',
    href: '/events',
    icon: Calendar,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Grievances',
    href: '/helpdesk',
    icon: LifeBuoy,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'E-Filing',
    href: '/e-filing',
    icon: FileText,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    accesses: ['Overview', 'Branches', 'Users', 'Tucoswa Affiliates', 'Financial', 'Projects', 'Events', 'Grievances', 'E-Filing', 'Settings'],
  }
]