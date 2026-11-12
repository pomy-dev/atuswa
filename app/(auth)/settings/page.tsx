'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import {
  User, Mail, Building2, Calendar, Lock, Activity, Clock, Shield, CheckCircle2,
  AlertCircle, Info,
} from 'lucide-react'
import { Role, Permission } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { recordActivityLog } from '@/lib/constants'
import { getAllRoles, getAllPermissions } from '@/services/auth-services'
import { useUserIP } from '@/lib/userUserIp'
import { getUserActivityLogs } from '@/services/auth-services'

export default function SettingsPage() {
  const { user, updatePassword } = useAuth()
  const { ip } = useUserIP()
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [myAccesses, setMyAccesses] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    const getMyActivityLogs = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      const logs = await getUserActivityLogs(supabase, session, user!.id)
      // console.log(logs)
      setActivityLogs(
        logs.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
    }

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

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })
    void getMyActivityLogs().catch((error: unknown) => {
      console.error('Unable to load activity logs:', error)
    });
    void getRoleModules();

    return () => {
      cancelled = true
    }
  }, [user, roles, myAccesses])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setIsSubmitting(true)

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      setIsSubmitting(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      setIsSubmitting(false)
      return
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from old password')
      setIsSubmitting(false)
      return
    }

    try {
      await updatePassword(passwordData.oldPassword, passwordData.newPassword)

      const logs = JSON.parse(localStorage.getItem(`activity_logs_${user?.id}`) || '[]')
      logs.push({
        timestamp: new Date().toISOString(),
        action: 'Password Changed',
        details: 'User changed their password',
      })
      localStorage.setItem(`activity_logs_${user?.id}`, JSON.stringify(logs))

      // Refresh logs in UI
      setActivityLogs(
        logs.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      )

      setPasswordMessage('Password changed successfully!')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })

      setTimeout(() => setPasswordMessage(''), 4000)

      recordActivityLog('Update', `Updated account password`, user?.id, user?.name, ip!)
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Unable to change password.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleModules = () => {
    const myRole = roles.find((r) => r.name === user?.role)
    const mySystemAccesses = myRole?.accesses
    setMyAccesses(mySystemAccesses);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account information, security, and preferences
          </p>
        </div>

        {/* Profile Overview */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-semibold text-primary">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {user?.name}
                  </h2>
                  <Badge variant="secondary" className="capitalize font-medium">
                    {user?.role?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Account Info + Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your personal and organizational details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </div>
                    <p className="font-medium">{user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      Branch
                    </div>
                    <p className="font-medium">{user?.branchId || '—'}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </div>
                    <p className="font-medium">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                        : '—'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Role
                    </div>
                    <p className="font-medium capitalize">
                      {user?.role?.replace(/_/g, ' ') || '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security / Change Password */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  Security
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {passwordMessage && (
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{passwordMessage}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, oldPassword: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="At least 6 characters"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Use a strong password you haven’t used elsewhere.
                    </p>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                      {isSubmitting ? 'Updating…' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Role + Activity */}
          <div className="space-y-6">
            {/* Role & Access */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  Access & Permissions
                </CardTitle>
                <CardDescription>Modules available to your role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Current Role
                  </p>
                  <Badge className="capitalize text-sm px-3 py-1">
                    {user?.role?.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Accessible Modules
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {myAccesses?.map((access: any, idx: number) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="font-normal text-xs"
                      >
                        {access}
                      </Badge>
                    ))}
                    {myAccesses?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No modules assigned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest account actions</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No activity yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actions you take will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {activityLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="group relative pl-4 border-l-2 border-border hover:border-primary/40 transition-colors"
                      >
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium leading-none">
                            {log.action}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground">
                              {log.details}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* About */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">TUCOSWA Management System</p>
                <p className="text-sm text-muted-foreground">Version 1.0</p>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  A comprehensive platform for managing union operations including
                  members, finances, projects, and events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}