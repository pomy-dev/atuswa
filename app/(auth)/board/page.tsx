'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { Permission, Role, AppUser, ActivityLogEntry } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  FileDown,
  RotateCcwKey,
  Trash2,
  Filter,
  Calendar,
  Activity,
  Users,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import {
  getAllPermissions,
  createRole,
  getAllRoles,
  updateRole,
  getAllUsersWithRoles,
  createUserAccount,
  updateUserAccount,
  resendInvitation,
  deleteUserAccount,
  getActivityLogs,
} from '@/services/auth-services'
import { cn } from "@/lib/utils"
import { canSee, formatLabel, menuItems, getRoleAccesses } from '@/lib/constants'
import { FullScreenLoader } from '@/components/fullScreenLoader'

// Report generation
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  HeadingLevel,
} from 'docx'

const PAGE_SIZE = 10
const EXCEL_PASSWORD = 'P@$$W0rd'

// ---------- Component ----------
export default function UserManagementPage() {
  const { user } = useAuth()

  // Data state
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [activitySearch, setActivitySearch] = useState('')

  // Pagination
  const [usersPage, setUsersPage] = useState(1)
  const [logsPage, setLogsPage] = useState(1)

  // Sheet (slide-over) state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    status: 'inactive' as 'inactive' | 'active',
  })

  // Role form state
  const [roleSheetOpen, setRoleSheetOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    accesses: menuItems,
    description: '',
    permissions: [] as Permission[],
  })

  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const [loadedRoles, loadedPermissions] = await Promise.all([
        getAllRoles(supabase, session),
        getAllPermissions(supabase, session),
      ])

      if (!cancelled) {
        setRoles(loadedRoles ?? [])
        setPermissions(loadedPermissions ?? [])
      }
    }

    const loadUsersAndActivityLogs = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const loadedUsers = await getAllUsersWithRoles(supabase, session)
      const usersList = loadedUsers ?? []
      const loadedLogs = await getActivityLogs(supabase, session)
      const usersById = new Map(
        usersList.map((loadedUser) => [loadedUser.id, loadedUser.full_name])
      )
      const logsWithUserNames = (loadedLogs ?? []).map(
        (log: ActivityLogEntry & { user_id?: string }) => {
          const logUserId = log.userId ?? log.user_id
          return {
            ...log,
            user_name:
              (logUserId && usersById.get(logUserId)) ??
              log.user_name ??
              'Unknown user',
          }
        }
      )

      if (!cancelled) {
        setUsers(usersList)
        setLogs(logsWithUserNames)
      }
    }

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })
    void loadUsersAndActivityLogs().catch((error: unknown) => {
      console.error('Unable to load users and logs:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user])

  // Reset page when filters change
  useEffect(() => {
    setUsersPage(1)
  }, [searchQuery, statusFilter, dateFilter])

  useEffect(() => {
    setLogsPage(1)
  }, [activitySearch])

  // ---------- Helpers ----------
  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name ?? 'Unknown'

  const getRolePermissionIds = (role: Role): string[] =>
    (role.permissions as unknown[]).flatMap((permission) => {
      if (typeof permission === 'string') return [permission]
      if (!permission || typeof permission !== 'object') return []

      const permissionRecord = permission as Record<string, unknown>
      const id = permissionRecord.id ?? permissionRecord.permission_id
      return typeof id === 'string' ? [id] : []
    })

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getRoleName(u.role_id).toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const created = new Date(u.createdAt)
        const now = new Date()
        if (dateFilter === '7d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 7))
        } else if (dateFilter === '30d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 30))
        } else if (dateFilter === '90d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 90))
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [users, searchQuery, statusFilter, dateFilter, roles])

  const filteredLogs = useMemo(() => {
    if (!activitySearch.trim()) return logs
    const q = activitySearch.toLowerCase()
    return logs.filter(
      (log) =>
        (log.user_name ?? '').toLowerCase().includes(q) ||
        (log.action ?? '').toLowerCase().includes(q) ||
        (log.details ?? '').toLowerCase().includes(q) ||
        (log.ip ?? '').toLowerCase().includes(q)
    )
  }, [logs, activitySearch])

  // Pagination slices
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, usersPage])

  const logsTotalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const paginatedLogs = useMemo(() => {
    const start = (logsPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, logsPage])

  // ---------- Report helpers ----------
  // const downloadExcelWithPassword = (
  //   data: Record<string, unknown>[],
  //   sheetName: string,
  //   fileName: string
  // ) => {
  //   // Standard xlsx does not support password in free version.
  //   // We still generate a normal .xlsx and note the intended password.
  //   // For real password protection use SheetJS Pro or a backend.
  //   const ws = XLSX.utils.json_to_sheet(data)
  //   const wb = XLSX.utils.book_new()
  //   XLSX.utils.book_append_sheet(wb, ws, sheetName)

  //   // Attempt password via write options if your build supports it
  //   // (SheetJS Community build ignores password; Pro supports it)
  //   const wbout = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array',
  //     password: EXCEL_PASSWORD,
  //   })

  //   const blob = new Blob([wbout], {
  //     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   })
  //   saveAs(blob, fileName)
  //   toast.success(
  //     `Excel exported. The file is locked`
  //   )
  // }

  const downloadExcelProtected = async (
    data: Record<string, unknown>[],
    sheetName: string,
    fileName: string
  ) => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(sheetName.slice(0, 31))

    if (data.length === 0) {
      sheet.addRow(['No data'])
    } else {
      const headers = Object.keys(data[0])
      sheet.addRow(headers)
      data.forEach((row) => {
        sheet.addRow(headers.map((h) => {
          const v = row[h]
          if (v == null) return ''
          if (typeof v === 'object') return String(v)
          return v as string | number | boolean
        }))
      })
    }

    // Lock sheet (user can open the file, but needs password to edit structure/cells)
    await sheet.protect(EXCEL_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: true,
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, fileName)
    toast.success(`Excel downloaded (sheet locked with password)`)
  }

  const buildUsersReportData = () =>
    filteredUsers.map((u) => ({
      Role: getRoleName(u.role_id),
      'Full Name': u.full_name,
      Email: u.email,
      Phone: u.phone ?? '',
      'Date Created': new Date(u.createdAt).toLocaleDateString(),
      Status: u.status,
      'Last Login': u.lastLogin
        ? new Date(u.lastLogin).toLocaleString()
        : 'Never',
    }))

  const buildLogsReportData = () =>
    filteredLogs.map((log) => ({
      User: log.user_name ?? 'Unknown',
      Action: log.action,
      Details: log.details ?? '',
      Timestamp: new Date(log.created_at).toLocaleString(),
      IP: log.ip ?? '',
    }))

  const generateUsersExcel = () => {
    setExporting(true)
    try {
      downloadExcelProtected(
        buildUsersReportData(),
        'Users',
        `users_report_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (e) {
      toast.error(`Excel export failed: ${e}`)
    } finally {
      setExporting(false)
    }
  }

  const generateLogsExcel = () => {
    setExporting(true)
    try {
      downloadExcelProtected(
        buildLogsReportData(),
        'Activity Logs',
        `activity_logs_report_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (e) {
      toast.error(`Excel export failed: ${e}`)
    } finally {
      setExporting(false)
    }
  }

  const generateUsersWord = async () => {
    setExporting(true)
    try {
      const rows = buildUsersReportData()
      const header = Object.keys(rows[0] ?? {
        Role: '',
        'Full Name': '',
        Email: '',
        Phone: '',
        'Date Created': '',
        Status: '',
        'Last Login': '',
      })

      const tableRows = [
        new DocxTableRow({
          children: header.map(
            (h) =>
              new DocxTableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA },
              })
          ),
        }),
        ...rows.map(
          (row) =>
            new DocxTableRow({
              children: header.map(
                (h) =>
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun(String((row as any)[h] ?? '')),
                        ],
                      }),
                    ],
                    width: { size: 2000, type: WidthType.DXA },
                  })
              ),
            })
        ),
      ]

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: 'Users Report',
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: `Generated: ${new Date().toLocaleString()}`,
                spacing: { after: 200 },
              }),
              new DocxTable({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(
        blob,
        `users_report_${new Date().toISOString().slice(0, 10)}.docx`
      )
      toast.success('Word report downloaded')
    } catch (e) {
      toast.error(`Word export failed: ${e}`)
    } finally {
      setExporting(false)
    }
  }

  const generateLogsWord = async () => {
    setExporting(true)
    try {
      const rows = buildLogsReportData()
      const header = Object.keys(rows[0] ?? {
        User: '',
        Action: '',
        Details: '',
        Timestamp: '',
        IP: '',
      })

      const tableRows = [
        new DocxTableRow({
          children: header.map(
            (h) =>
              new DocxTableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA },
              })
          ),
        }),
        ...rows.map(
          (row) =>
            new DocxTableRow({
              children: header.map(
                (h) =>
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun(String((row as any)[h] ?? '')),
                        ],
                      }),
                    ],
                    width: { size: 2000, type: WidthType.DXA },
                  })
              ),
            })
        ),
      ]

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: 'Activity Logs Report',
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: `Generated: ${new Date().toLocaleString()}`,
                spacing: { after: 200 },
              }),
              new DocxTable({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(
        blob,
        `activity_logs_report_${new Date().toISOString().slice(0, 10)}.docx`
      )
      toast.success('Word report downloaded')
    } catch (e) {
      toast.error(`Word export failed: ${e}`)
    } finally {
      setExporting(false)
    }
  }

  // ---------- User actions ----------
  const openAddUser = () => {
    setEditingUser(null)
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id ?? '',
      status: 'inactive',
    })
    setSheetOpen(true)
  }

  const openEditUser = (u: AppUser) => {
    setEditingUser(u)
    setFormData({
      fullName: u.full_name,
      email: u.email,
      phone: u.phone ?? '',
      roleId: u.role_id,
      status: u.status,
    })
    setSheetOpen(true)
  }

  const handleSaveUser = useCallback(async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      setSaving(true)
      if (editingUser) {
        const userPayload = {
          user_id: editingUser?.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.roleId,
          status: formData.status,
        }

        const updatedUser = await updateUserAccount(
          supabase,
          session,
          userPayload
        )

        if (updatedUser) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === editingUser.id
                ? {
                  ...u,
                  full_name: formData.fullName,
                  email: formData.email,
                  phone: formData.phone || undefined,
                  role_id: formData.roleId,
                  status: formData.status,
                }
                : u
            )
          )
          toast.success('User updated successfully')
        }
      } else {
        const newUser: AppUser = {
          id: `u_${Date.now()}`,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.roleId,
          status: formData.status,
          createdAt: new Date().toISOString(),
        }

        const createdUser = await createUserAccount(
          supabase,
          session,
          newUser
        )

        if (createdUser) {
          setUsers((prev) => [...prev, newUser])
          toast.success('Account created.')
        }
      }
      setSheetOpen(false)
    } catch (err) {
      toast.error(`Encountered error: ${err}`)
      throw new Error(`Encountered error: ${err}`)
    } finally {
      setSaving(false)
    }
  }, [editingUser, formData])

  const handleResendInvitation = useCallback(async (user: any) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      setSending(true)
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!currentSession) {
        throw new Error('Your session has expired. Please log in again.')
      }

      await resendInvitation(supabase, currentSession, user.id)
      toast.success('Invitation email sent successfully.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation.')
    } finally {
      setSending(false)
    }
  }, [])

  const handleDeleteUser = useCallback(async (id: string) => {
    if (!id) return

    if (confirm('Are you sure you want to delete this user?')) {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) throw new Error('You must be signed in to manage roles.')

      try {
        setRemoving(true)
        const res = await deleteUserAccount(supabase, session, id)
        res && setUsers((prev) => prev.filter((u) => u.id !== id))
      } catch (error) {
        toast.error(`Failed to remove account. ${error}`)
        throw new Error(`Encountered error: ${error}`)
      } finally {
        setRemoving(false)
      }
    }
  }, [])

  const handleExportUsers = () => {
    const headers = ['Role', 'Full Name', 'Email', 'Date Created', 'Status']
    const rows = filteredUsers.map((u) => [
      getRoleName(u.role_id),
      u.full_name,
      u.email,
      new Date(u.createdAt).toLocaleDateString(),
      u.status,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- Role actions ----------
  const openAddRole = () => {
    setEditingRole(null)
    setRoleForm({ name: '', accesses: [], description: '', permissions: [] })
    setRoleSheetOpen(true)
  }

  const openEditRole = (role: Role) => {
    const selectedPermissionIds = new Set(getRolePermissionIds(role))
    const selectedAccess = new Set(getRoleAccesses(role))
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      accesses: menuItems.filter((item) => selectedAccess.has(item.label)),
      description: role.description ?? '',
      permissions: permissions.filter((permission) =>
        selectedPermissionIds.has(permission.id)
      ),
    })
    setRoleSheetOpen(true)
  }

  const handleSaveRole = useCallback(async () => {
    if (!roleForm.name.trim()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      setSaving(true)
      if (editingRole) {
        const rolePayload: Role = {
          id: editingRole.id,
          name: roleForm.name,
          accesses: roleForm.accesses.map((item) => item.label),
          description: roleForm.description,
          permissions: roleForm.permissions.map((p) => p.id),
          createdAt: editingRole.createdAt,
        }
        const updatedRole = await updateRole(supabase, session, rolePayload)

        if (updatedRole) {
          setRoles((prev) =>
            prev.map((role) =>
              role.id === editingRole.id
                ? {
                  ...role,
                  name: roleForm.name,
                  accesses: roleForm.accesses.map((item) => item.label),
                  description: roleForm.description,
                  permissions: roleForm.permissions.map((p) => p.id),
                }
                : role
            )
          )
        }
      } else {
        const rolePayload: Role = {
          id: `role_${Date.now()}`,
          name: roleForm.name,
          accesses: roleForm.accesses.map((item) => item.label),
          description: roleForm.description,
          permissions: roleForm.permissions.map((p) => p.id),
          createdAt: new Date().toISOString(),
        }
        const newRole = await createRole(supabase, session, rolePayload)
        if (newRole) {
          setRoles((prevRoles) => [...prevRoles, newRole])
        }
      }
      setRoleSheetOpen(false)
    } catch (error) {
      throw new Error(`Encountered error: ${error}`)
    } finally {
      setSaving(false)
    }
  }, [editingRole, roleForm])

  const togglePermission = (permissionToToggle: Permission) => {
    setRoleForm((prev) => {
      const isSelected = prev.permissions.some(
        (p: Permission) => p.id === permissionToToggle.id
      )

      return {
        ...prev,
        permissions: isSelected
          ? prev.permissions.filter(
            (p: Permission) => p.id !== permissionToToggle.id
          )
          : [...prev.permissions, permissionToToggle],
      }
    })
  }

  const toggleAccess = (accessToToggle: string) => {
    setRoleForm((prev) => {
      const isSelected = prev.accesses.some(
        (item: any) => item.label === accessToToggle
      )

      return {
        ...prev,
        accesses: isSelected
          ? prev.accesses.filter(
            (item: any) => item.label !== accessToToggle
          )
          : [
            ...prev.accesses,
            menuItems.find((item) => item.label === accessToToggle)!,
          ],
      }
    })
  }

  // Access control
  if (canSee(user?.role ?? '', roles.map((role) => role.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Only the Secretary General can manage users and roles.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pagination UI helper
  const PaginationControls = ({
    page,
    totalPages,
    totalItems,
    onPageChange,
  }: {
    page: number
    totalPages: number
    totalItems: number
    onPageChange: (p: number) => void
  }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-muted-foreground">
        Showing{' '}
        {totalItems === 0
          ? 0
          : (page - 1) * PAGE_SIZE + 1}
        –
        {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // ---------- Render ----------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage roles, users, and activity across the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* ==================== USER ROLES TAB ==================== */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define roles and configure their permissions
            </p>
            <Button onClick={openAddRole} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatLabel(role.name)}
                      </CardTitle>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditRole(role)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {getRolePermissionIds(role)
                      .slice(0, 4)
                      .map((permissionId) => {
                        const permission = permissions.find(
                          (p) => p.id === permissionId
                        )
                        return (
                          <Badge
                            key={permissionId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {permission?.label ?? permissionId}
                          </Badge>
                        )
                      })}
                    {getRolePermissionIds(role).length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{getRolePermissionIds(role).length - 4} more
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==================== USERS TAB ==================== */}
        <TabsContent value="users" className="space-y-4">
          {/* Toolbar: Search first */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as string)}
                >
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as string)}
                >
                  <SelectTrigger className="w-[160px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date Created" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" className="gap-2" disabled={exporting}>
                      <Download className="w-4 h-4" />
                      Generate Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={generateUsersExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel (locked)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={generateUsersWord}>
                      <FileText className="w-4 h-4 mr-2" />
                      Word
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportUsers}>
                      <FileDown className="w-4 h-4 mr-2" />
                      CSV (quick)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={openAddUser} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {getRoleName(u.role_id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {u.full_name}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone}</TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.status === 'active' ? 'default' : 'secondary'
                            }
                            className={cn(
                              u.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({
                                variant: 'ghost',
                                size: 'icon',
                              })}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditUser(u)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditUser(u)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const data = JSON.stringify(u, null, 2)
                                  const blob = new Blob([data], {
                                    type: 'application/json',
                                  })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `${u.full_name.replace(
                                    /\s+/g,
                                    '_'
                                  )}_details.json`
                                  a.click()
                                  URL.revokeObjectURL(url)
                                }}
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Export Details
                              </DropdownMenuItem>

                              {user?.role?.toLowerCase() ===
                                'secretary general' &&
                                u?.status === 'inactive' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleResendInvitation(u)
                                    }
                                  >
                                    <RotateCcwKey className="w-4 h-4 mr-2" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}

                              <DropdownMenuSeparator />
                              {user?.role?.toLowerCase() ===
                                'secretary general' && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteUser(u.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <PaginationControls
                page={usersPage}
                totalPages={usersTotalPages}
                totalItems={filteredUsers.length}
                onPageChange={setUsersPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACTIVITY LOG TAB ==================== */}
        <TabsContent value="activity" className="space-y-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Recent activity across all users, including last login events
            </p>

            {/* Search first */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activity by user, action, details, or IP..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" className="gap-2" disabled={exporting}>
                    <Download className="w-4 h-4" />
                    Generate Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={generateLogsExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel (locked)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={generateLogsWord}>
                    <FileText className="w-4 h-4 mr-2" />
                    Word
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No activity recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.user_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.action.toLowerCase().includes('login') ? (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Activity className="w-4 h-4 text-muted-foreground" />
                            )}
                            {log.action}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {log.details ?? '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ip ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <PaginationControls
                page={logsPage}
                totalPages={logsTotalPages}
                totalItems={filteredLogs.length}
                onPageChange={setLogsPage}
              />
            </CardContent>
          </Card>

          {/* Last login summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last Login Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-sm">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Last login
                      </p>
                      <p className="text-sm">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== User Sheet ========== */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right px-6"
        >
          <SheetHeader>
            <SheetTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </SheetTitle>
            <SheetDescription>
              {editingUser
                ? 'Update user details and permissions.'
                : 'Fill in the details to create a new user account.'}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="jane.doe@union.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="+268 0000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, roleId: val ?? '' }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  Active users can sign in
                </p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? 'active' : 'inactive',
                  }))
                }
              />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {editingUser
                ? saving
                  ? 'Saving...'
                  : 'Save Changes'
                : saving
                  ? 'Creating...'
                  : 'Create User'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ========== Role Sheet ========== */}
      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right px-6"
        >
          <SheetHeader>
            <SheetTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </SheetTitle>
            <SheetDescription>
              Name the role and select the permissions it should have.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Moderator"
                disabled={
                  roleForm.name?.toLowerCase() === 'secretary general' ||
                  roleForm.name?.toLowerCase() === 'branch admin'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDesc">Description</Label>
              <Textarea
                id="roleDesc"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">System Access</Label>
              <div className="space-y-3 border rounded-lg p-3">
                {menuItems.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <Checkbox
                      id={item.label}
                      checked={roleForm.accesses.some(
                        (a: any) => a.label === item.label
                      )}
                      onCheckedChange={() => toggleAccess(item.label)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={item.label}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {item.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-3 border rounded-lg p-3">
                {permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={perm.id}
                      checked={roleForm.permissions.some(
                        (p: any) => p.id === perm.id
                      )}
                      onCheckedChange={() => togglePermission(perm)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {perm.label}
                      </label>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setRoleSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {editingRole
                ? saving
                  ? 'Saving...'
                  : 'Save Role'
                : saving
                  ? 'Creating...'
                  : 'Create Role'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FullScreenLoader isLoading={removing || sending || exporting} />
    </div>
  )
}