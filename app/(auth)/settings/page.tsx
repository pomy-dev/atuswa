'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { User, Mail, Building2, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()

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
