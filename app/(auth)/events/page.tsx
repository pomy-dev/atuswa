'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import {
  UserRole, EventInvitation, Role, Permission, Stakeholder, WorkspaceEvent,
  Event
} from '@/lib/types'
import { toast } from 'sonner'
import {
  Plus, Trash2, Calendar, MapPin, Upload, X, Users, Share2,
  Mail, MessageCircle,
} from 'lucide-react'
import Twitter from '@/public/twitter.png'
import Facebook from '@/public/facebook.png'
import { EventInviteModal } from '@/components/modals/event-invite-modal'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getAllPermissions, getAllRoles } from '@/services/auth-services'
import {
  getEvents, deleteEvent, createEvent, getEventFiles, getEventInvitations, createBulkEventInvitations, uploadEventFile
} from '@/services/events-service'
import { getAllBranches } from '@/services/branch-service'
import { useUserIP } from '@/lib/userUserIp'
import { cn } from '@/lib/utils'
import {
  canSee,
  getDaysLeft, formatDaysLeft, getMonthKey, getMonthLabel,
  currentMonthKey, recordActivityLog
} from '@/lib/constants'
import { Spinner } from '@/components/ui/spinner'

export default function EventsPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const router = useRouter()

  const [events, setEvents] = useState<WorkspaceEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState(true)
  const [showOlderEvents, setShowOlderEvents] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    date: '',
    location: '',
    branchId: '',
  })

  const [stakeholders, setStakeholders] = useState<(Stakeholder & { imageFile?: File })[]>([])
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    profession: '',
    imageFile: null as File | null,
    previewUrl: '' as string,
  })

  const [images, setImages] = useState<{ file: File; caption?: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageCaption, setImageCaption] = useState('')
  const [files, setFiles] = useState<{ file: File; name: string; caption?: string }[]>([])
  const [fileFile, setFileFile] = useState<File | null>(null)
  const [fileCaption, setFileCaption] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  const normalizedRole = user?.role.toLowerCase().replace(/[_-]+/g, ' ').trim()
  const isSecretaryGeneral = normalizedRole === 'secretary general' || normalizedRole === 'sg'
  const isBranchAdmin = normalizedRole === 'branch admin' || normalizedRole === 'branch administrator'

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data: { session }, error } = await supabase.auth.getSession()
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

    const loadAllBranches = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const branches = await getAllBranches(supabase);
        const normalized = branches.map((b: any) => ({
          ...b,
          name: b.branch_name,
          isActive: b.is_active,
          contactEmail: b.contact_email,
          adminId: b.admin_id ?? b.adminId,
          createdAt: b.created_at ? new Date(b.created_at) : new Date(),
        }))
        if (!cancelled) setBranches(normalized)
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    void loadAllBranches().catch(console.error)

    void loadRolesAndPermissions().catch(console.error)

    void loadAllEvents().catch(console.error)


    if (!isSecretaryGeneral && user.branchId) {
      setFormData((prev) => ({ ...prev, branchId: user.branchId }))
    }

    return () => { cancelled = true }
  }, [user, isSecretaryGeneral])

  const loadAllEvents = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    try {
      setIsLoading(true)
      const allEvents = await getEvents(supabase);
      const visible = allEvents.filter((e) => isSecretaryGeneral || e.branch_id === user?.branchId)
      console.log(visible)
      const hydrated = await Promise.all(visible.map(async (event) => {
        const [attachments, invitations] = await Promise.all([getEventFiles(supabase, event.id), getEventInvitations(supabase, event.id)])
        return { ...event, images: attachments.filter((file) => file.file_kind === 'image'), documents: attachments.filter((file) => file.file_kind === 'document'), invitations }
      }))
      setEvents(hydrated)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (canSee(user?.role ?? '', roles.map((r) => r.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don&apos;t have permission to view events.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── helpers ──
  const getStatusBadge = (event: WorkspaceEvent) => {
    const status = event.status || (getDaysLeft(event.event_date) >= 0 ? 'published' : 'draft')
    if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>
    if (status === 'draft') return <Badge variant="secondary">Draft</Badge>
    const days = getDaysLeft(event.event_date)
    if (days < 0) return <Badge variant="outline">Past</Badge>
    if (days === 0) return <Badge className="bg-amber-500 hover:bg-amber-600">Today</Badge>
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Upcoming</Badge>
  }

  const currentMonthEvents = useMemo(() => {
    const key = currentMonthKey()
    return events
      .filter((e) => getMonthKey(e.event_date || e.created_at) === key)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }, [events])

  const olderEventsByMonth = useMemo(() => {
    const key = currentMonthKey()
    const older = events.filter((e) => getMonthKey(e.event_date || e.created_at) !== key)
    const groups: Record<string, WorkspaceEvent[]> = {}
    older.forEach((e) => {
      const mk = getMonthKey(e.event_date || e.created_at)
      if (!groups[mk]) groups[mk] = []
      groups[mk].push(e)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, list]) => ({
        monthKey,
        label: getMonthLabel(monthKey),
        events: list.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()),
      }))
  }, [events])

  const displayedGridEvents = showCurrentMonthOnly ? currentMonthEvents : events

  // ── form helpers (images / files / stakeholders) ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewStakeholder((prev) => ({ ...prev, imageFile: file, previewUrl: URL.createObjectURL(file) }))
  }

  const addStakeholder = async () => {
    if (!newStakeholder.name.trim() || !newStakeholder.profession.trim()) return
    let imageUrl = ''
    if (newStakeholder.imageFile) {
      imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(newStakeholder.imageFile!)
      })
    }
    setStakeholders([
      ...stakeholders,
      {
        id: `sh_${Date.now()}`,
        name: newStakeholder.name.trim(),
        profession: newStakeholder.profession.trim(),
        image: imageUrl || undefined,
        imageFile: newStakeholder.imageFile || undefined,
      },
    ])
    setNewStakeholder({ name: '', profession: '', imageFile: null, previewUrl: '' })
  }

  const removeStakeholder = (id: string) => setStakeholders(stakeholders.filter((s) => s.id !== id))

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageFile(file)
  }

  const addImage = async () => {
    if (!imageFile) return
    setImages([...images, { file: imageFile, caption: imageCaption }])
    setImageFile(null)
    setImageCaption('')
  }

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileFile(file)
  }

  const addFile = async () => {
    if (!fileFile) return
    setFiles([...files, { file: fileFile, name: fileFile.name, caption: fileCaption }])
    setFileFile(null)
    setFileCaption('')
  }

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

  const resetForm = () => {
    setFormData({
      title: '',
      notes: '',
      date: '',
      location: '',
      branchId: isSecretaryGeneral ? '' : user?.branchId || '',
    })
    setStakeholders([])
    setImages([])
    setFiles([])
    setNewStakeholder({ name: '', profession: '', imageFile: null, previewUrl: '' })
    setImageFile(null)
    setImageCaption('')
    setFileFile(null)
    setFileCaption('')
    setShowForm(false)
  }

  const handleAddEvent = async () => {
    const title = formData.title.trim()
    const location = formData.location.trim()
    const branchId = isSecretaryGeneral ? formData.branchId : user?.branchId

    if (!title || !formData.date || !location) {
      toast.error('Please provide an event title, date, and location.')
      return
    }
    if (isSecretaryGeneral && !branchId) {
      toast.error('Please select a branch for this event.')
      return
    }
    if (!user) {
      toast.error('You must be signed in to create an event.')
      return
    }
    if (!branchId) {
      toast.error('Your account is not assigned to a branch.')
      return
    }

    try {
      setIsSavingEvent(true)
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const createdEvent = await createEvent(supabase, {
        branch_id: branchId || null,
        affiliate_id: null,
        title,
        notes: formData.notes,
        event_date: new Date(formData.date).toISOString(),
        location,
        stakeholders: stakeholders.map((s) => s.name),
      }, user.id)

      const attachments = [
        ...images.map(({ file }) => ({ file, kind: 'image' as const })),
        ...files.map(({ file }) => ({ file, kind: 'document' as const })),
        ...stakeholders.flatMap((stakeholder) =>
          stakeholder.imageFile ? [{ file: stakeholder.imageFile, kind: 'image' as const }] : []
        ),
      ]
      const uploadResults = await Promise.allSettled(
        attachments.map(({ file, kind }) => uploadEventFile(supabase, createdEvent.id, file, kind))
      )
      const failedUploads = uploadResults.filter((result) => result.status === 'rejected')

      resetForm()
      toast.success(`Event created: ${createdEvent.title}`)
      recordActivityLog('Create', `Created event - ${createdEvent.title}`, user?.id, user?.name, ip || '')
      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} attachment(s) could not be uploaded. See the console for details.`)
        failedUploads.forEach((result) => {
          if (result.status === 'rejected') console.error('Event attachment upload failed:', result.reason)
        })
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Could not create event.')
    } finally {
      setIsSavingEvent(false)
      await loadAllEvents()
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    if (!confirm("Are you sure to delete event? This action is irreversible!")) return
    try {
      await deleteEvent(supabase, id)
      recordActivityLog('Delete', `Deleted event`, user?.id, user?.name, ip!)
    } catch (err) {
      console.error(err)
    } finally {
      await loadAllEvents()
    }
  }

  const handleInviteClick = (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedEventId(eventId)
    setShowInviteModal(true)
  }

  const handleEventInvite = async (newInvitations: EventInvitation[], eventId: string, eventTitle: string) => {
    if (!newInvitations?.length) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    try {
      setIsInviting(true)
      await createBulkEventInvitations(supabase, {
        event_id: eventId,
        invitations: newInvitations.map(({ name, email, phone }) => ({ name, email, phone })),
      }, eventTitle)
      toast.success(`${newInvitations.length} invitation(s) saved.`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Could not save invitations.')
    } finally {
      setIsInviting(false)
      await loadAllEvents()
    }
  }

  const getShareText = (event: WorkspaceEvent) =>
    `Join us for ${event.title} on ${new Date(event.event_date).toLocaleString()} at ${event.location}`

  const shareActions = (event: WorkspaceEvent) => [
    {
      label: 'Email',
      icon: <Mail className="w-4 h-4" />,
      action: () =>
        window.open(
          `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(getShareText(event))}`,
          '_blank'
        ),
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      action: () =>
        window.open(`https://wa.me/?text=${encodeURIComponent(getShareText(event))}`, '_blank'),
    },
    {
      label: 'Facebook',
      icon: <img src={Facebook.src} alt="" className="w-4 h-4" />,
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodeURIComponent(getShareText(event))}`,
          '_blank'
        ),
    },
    {
      label: 'Twitter / X',
      icon: <img src={Twitter.src} alt="" className="w-4 h-4" />,
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(event))}`,
          '_blank'
        ),
    },
    {
      label: 'SMS',
      icon: <MessageCircle className="w-4 h-4" />,
      action: () => window.open(`sms:?body=${encodeURIComponent(getShareText(event))}`, '_blank'),
    },
    {
      label: 'More…',
      icon: <Share2 className="w-4 h-4" />,
      action: () => {
        if (navigator.share) {
          navigator.share({ title: event.title, text: getShareText(event), url: window.location.href })
        }
      },
    },
  ]

  // ── render ──
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Event Workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan, publish and manage company events
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Current month filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2 rounded-lg border bg-card px-4 py-2.5 shadow-sm">
          <Checkbox
            id="current-month"
            checked={showCurrentMonthOnly}
            onCheckedChange={(checked) => setShowCurrentMonthOnly(!!checked)}
          />
          <Label htmlFor="current-month" className="text-sm font-medium cursor-pointer select-none">
            {getMonthLabel(currentMonthKey())}
          </Label>
          <Badge variant="secondary" className="ml-1 text-xs">
            {currentMonthEvents.length}
          </Badge>
        </div>
      </div>

      {/* Grid */}
      {displayedGridEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {events.length === 0
                ? 'No events yet. Create your first event.'
                : 'No events in the selected period.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedGridEvents.map((event) => {
            const inviteCount = event.invitations?.length || 0
            return (
              <Card
                key={event.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-border"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    {getStatusBadge(event)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.event_date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <p className="text-xs font-medium text-foreground/80">
                      {formatDaysLeft(event.event_date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {inviteCount} invitee{inviteCount === 1 ? '' : 's'}
                  </div>

                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5">
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        {shareActions(event).map((item) => (
                          <DropdownMenuItem key={item.label} onClick={item.action} className="gap-2 text-sm">
                            {item.icon}
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="sm"
                      className="h-8 flex-1 gap-1.5"
                      onClick={(e) => handleInviteClick(event.id, e)}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Show Older Events */}
      {olderEventsByMonth.length > 0 && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'bg-background px-6 text-xs font-medium tracking-wide uppercase',
                'border border-border shadow-none hover:bg-muted/50',
                showOlderEvents && 'bg-muted'
              )}
              onClick={() => setShowOlderEvents((v) => !v)}
            >
              {showOlderEvents ? 'Hide Older Events' : 'Show Older Events'}
            </Button>
          </div>
        </div>
      )}

      {showOlderEvents && olderEventsByMonth.length > 0 && (
        <div className="space-y-8">
          {olderEventsByMonth.map((group) => (
            <div key={group.monthKey} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                {group.label}
              </h3>
              <div className="rounded-xl border bg-card divide-y">
                {group.events.map((event) => {
                  const initials = event.title
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(event)}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(event.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CREATE EVENT MODAL ===== */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) resetForm()
        setShowForm(open)
      }}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Create New Event
            </DialogTitle>
            <DialogDescription>
              Fill in the details below. You can add images, files and stakeholders.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="event-title">Event Title</Label>
                  <Input
                    id="event-title"
                    placeholder="Annual General Meeting"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-date">Date & Time</Label>
                  <Input
                    id="event-date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="Conference Room"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-branch">Branch *</Label>
                {isSecretaryGeneral ? (
                  <select
                    id="event-branch"
                    required
                    value={formData.branchId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    id="event-branch"
                    value={formData.branchId || user?.branchId || ''}
                    disabled
                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-100"
                  >
                    <option value={formData.branchId || user?.branchId || ''}>
                      {branches.find((branch) => branch.id === (formData.branchId || user?.branchId))?.name
                        || (isBranchAdmin ? 'Your assigned branch' : 'Assigned branch')}
                    </option>
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-notes">Notes</Label>
                <Textarea
                  id="event-notes"
                  placeholder="Event description and additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* === IMAGES WITH CAPTIONS === */}
            <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
              <div>
                <Label className="text-base font-semibold">Event Images</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload photos with optional captions
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="cursor-pointer block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => document.getElementById('event-image-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {imageFile ? imageFile.name : 'Choose Image'}
                      </span>
                    </Button>
                    <input
                      id="event-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <Input
                  placeholder="Caption (optional)"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addImage} disabled={!imageFile} className="shrink-0">
                  Add
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl border bg-background overflow-hidden"
                    >
                      <img
                        src={img.file ? URL.createObjectURL(img.file) : ""}
                        alt={img.caption || 'Event Image'}
                        className="w-full h-32 object-cover"
                      />
                      {img.caption && (
                        <p className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                          {img.caption}
                        </p>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === FILES WITH CAPTIONS === */}
            <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
              <div>
                <Label className="text-base font-semibold">Attached Files</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Documents, PDFs, etc. with optional captions
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="cursor-pointer block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => document.getElementById('event-file-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {fileFile ? fileFile.name : 'Choose File'}
                      </span>
                    </Button>
                    <input
                      id="event-file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <Input
                  placeholder="Caption (optional)"
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addFile} disabled={!fileFile} className="shrink-0">
                  Add
                </Button>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border bg-background p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        {file.caption && (
                          <p className="text-xs text-muted-foreground truncate">
                            {file.caption}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => removeFile(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === STAKEHOLDERS === */}
            <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
              <div>
                <Label className="text-base font-semibold">Stakeholders</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  People involved in the event (with optional photo)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Full Name"
                  value={newStakeholder.name}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, name: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Profession / Position"
                  value={newStakeholder.profession}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, profession: e.target.value })
                  }
                  className="flex-1"
                />
                <label className="cursor-pointer shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('stakeholder-photo')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {newStakeholder.imageFile ? 'Change' : 'Photo'}
                  </Button>
                  <input
                    id="stakeholder-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                <Button
                  onClick={addStakeholder}
                  disabled={!newStakeholder.name.trim() || !newStakeholder.profession.trim()}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>

              {/* Preview of selected photo before adding */}
              {newStakeholder.previewUrl && (
                <div className="flex items-center gap-4 p-3 rounded-lg border bg-background">
                  <img
                    src={newStakeholder.previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border shadow-sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Photo ready</p>
                    <p className="text-xs text-muted-foreground">
                      Will be attached when you click Add
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setNewStakeholder((prev) => ({
                        ...prev,
                        imageFile: null,
                        previewUrl: '',
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              )}

              {/* Added stakeholders */}
              {stakeholders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stakeholders.map((sh) => (
                    <div
                      key={sh.id}
                      className="flex items-center gap-3 rounded-xl border bg-background p-3"
                    >
                      {sh.image ? (
                        <img
                          src={sh.image}
                          alt={sh.name}
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">
                          👤
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{sh.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sh.profession}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => removeStakeholder(sh.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={resetForm}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleAddEvent}
              disabled={!formData.title.trim() || !formData.date || !formData.location.trim() || isSavingEvent}
              className="flex-1 sm:flex-none"
            >
              {isSavingEvent && <Spinner className='h-4 w-4' />} Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventInviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSubmit={(invitations) => {
          if (selectedEventId) {
            handleEventInvite(invitations, selectedEventId, formData.title)
          }
        }}
        isLoading={isInviting}
        existingInvitations={
          events.find(e => e.id === selectedEventId)?.invitations || []
        }
      />
    </div>
  )
}
