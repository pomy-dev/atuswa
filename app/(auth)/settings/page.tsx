'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { User, Mail, Building2, Calendar, Lock, Activity, Clock } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem(`activity_logs_${user?.id}`) || '[]')
    setActivityLogs(logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }, [user])

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from old password')
      return
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const userIndex = users.findIndex((u: any) => u.id === user?.id)

    if (userIndex === -1) {
      setPasswordError('User not found')
      return
    }

    if (users[userIndex].password !== passwordData.oldPassword) {
      setPasswordError('Old password is incorrect')
      return
    }

    users[userIndex].password = passwordData.newPassword
    localStorage.setItem('users', JSON.stringify(users))

    // Log the password change
    const logs = JSON.parse(localStorage.getItem(`activity_logs_${user?.id}`) || '[]')
    logs.push({
      timestamp: new Date().toISOString(),
      action: 'Password Changed',
      details: 'User changed their password'
    })
    localStorage.setItem(`activity_logs_${user?.id}`, JSON.stringify(logs))

    setPasswordMessage('Password changed successfully!')
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    setShowPasswordForm(false)
    setTimeout(() => setPasswordMessage(''), 3000)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-accent-foreground">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="text-sm font-medium">{user?.branchId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">
                  {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Permissions</CardTitle>
          <CardDescription>Your access level and capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Role</p>
              <Badge className="capitalize">{user?.role.replace(/_/g, ' ')}</Badge>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Accessible Modules</p>
              <div className="grid grid-cols-2 gap-2">
                {user?.role === 'sg' && (
                  <>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Branches</Badge>
                    <Badge variant="outline">Board Members</Badge>
                    <Badge variant="outline">Members</Badge>
                    <Badge variant="outline">Financial</Badge>
                    <Badge variant="outline">Projects</Badge>
                    <Badge variant="outline">Events</Badge>
                    <Badge variant="outline">Helpdesk</Badge>
                    <Badge variant="outline">E-Filing</Badge>
                  </>
                )}
                {user?.role === 'branch_admin' && (
                  <>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Members</Badge>
                    <Badge variant="outline">Projects</Badge>
                    <Badge variant="outline">Events</Badge>
                    <Badge variant="outline">Helpdesk</Badge>
                    <Badge variant="outline">E-Filing</Badge>
                  </>
                )}
                {user?.role === 'treasurer' && (
                  <>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Financial</Badge>
                    <Badge variant="outline">Helpdesk</Badge>
                  </>
                )}
                {user?.role === 'project_coordinator' && (
                  <>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Projects</Badge>
                    <Badge variant="outline">E-Filing</Badge>
                  </>
                )}
                {user?.role === 'events_manager' && (
                  <>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Events</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>Change Password</Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <Label htmlFor="oldPassword">Old Password</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Update Password</Button>
                <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Logs
          </CardTitle>
          <CardDescription>Your recent account activities</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logs yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activityLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Atuswá Union Management System</p>
            <p className="text-sm text-muted-foreground">Version 1.0</p>
          </div>
          <p className="text-sm text-muted-foreground">
            A comprehensive platform for managing union operations including members, finances, projects, and events.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
