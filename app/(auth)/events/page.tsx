'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { UserRole, Event, EventInvitation } from '@/lib/types'
import { Plus, Trash2, Calendar, MapPin, Upload, X, Users, Share2, Mail, MessageCircle, FileText } from 'lucide-react'
import Twitter from '@/public/twitter.png'
import Facebook from '@/public/facebook.png'
import { EventInviteModal } from '@/components/modals/event-invite-modal'

interface Stakeholder {
  id: string
  name: string
  profession: string
  image?: string // base64 image
}

interface EventImage {
  url: string;
  caption?: string;
}

interface EventFile {
  url: string;
  name: string;
  caption?: string;
}

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBranch, setFilterBranch] = useState<string | null>('all')
  const [branches, setBranches] = useState<any[]>([])

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    date: '',
    location: '',
  })

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    profession: '',
    imageFile: null as File | null,
    previewUrl: '' as string,
  })

  const [images, setImages] = useState<EventImage[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageCaption, setImageCaption] = useState<string>('')
  const [files, setFiles] = useState<EventFile[]>([])
  const [fileFile, setFileFile] = useState<File | null>(null)
  const [fileCaption, setFileCaption] = useState<string>('')

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const [isInviting, setIsInviting] = useState(false)

  // Load events and branches
  useEffect(() => {
    if (!user) return
    const allEvents: Event[] = JSON.parse(localStorage.getItem('events') || '[]')
    const filtered = allEvents.filter((e: Event) =>
      user.role === UserRole.SECRETARY_GENERAL || e.branchId === user.branchId
    )
    setEvents(filtered)

    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]')
    setBranches(storedBranches)
  }, [user])

  // Permission check
  if (![UserRole.SECRETARY_GENERAL, UserRole.EVENTS_MANAGER, UserRole.BRANCH_ADMIN].includes(user?.role!)) {
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

  // Handle image preview before adding stakeholder
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setNewStakeholder(prev => ({ ...prev, imageFile: file, previewUrl }))
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

    const stakeholder: Stakeholder = {
      id: `sh_${Date.now()}`,
      name: newStakeholder.name.trim(),
      profession: newStakeholder.profession.trim(),
      image: imageUrl || undefined,
    }

    setStakeholders([...stakeholders, stakeholder])

    // Reset new stakeholder
    setNewStakeholder({ name: '', profession: '', imageFile: null, previewUrl: '' })
  }

  const removeStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter(s => s.id !== id))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
  }

  const addImage = async () => {
    if (!imageFile) return

    const imageUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(imageFile)
    })

    setImages([...images, { url: imageUrl, caption: imageCaption }])
    setImageFile(null)
    setImageCaption('')
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileFile(file)
  }

  const addFile = async () => {
    if (!fileFile) return

    const fileUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(fileFile)
    })

    setFiles([...files, { url: fileUrl, name: fileFile.name, caption: fileCaption }])
    setFileFile(null)
    setFileCaption('')
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleAddEvent = () => {
    if (!formData.title || !formData.date || !formData.location) return

    const newEvent: Event = {
      id: `event_${Date.now()}`,
      branchId: user!.branchId,
      title: formData.title,
      notes: formData.notes,
      date: new Date(formData.date),
      location: formData.location,
      stakeholders: stakeholders.map(s => s.name),
      images: images.map(img => ({ url: img.url, caption: img.caption })), // Save images with captions
      documents: files.map(file => ({ url: file.url, name: file.name, caption: file.caption })), // Save files with captions
      invitations: [],
      createdBy: user!.id,
      createdAt: new Date(),
    }

    const allEvents = JSON.parse(localStorage.getItem('events') || '[]')
    localStorage.setItem('events', JSON.stringify([...allEvents, newEvent]))

    setEvents([...events, newEvent])
    resetForm()
  }

  const resetForm = () => {
    setFormData({ title: '', notes: '', date: '', location: '' })
    setStakeholders([])
    setImages([])
    setFiles([])
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const allEvents = JSON.parse(localStorage.getItem('events') || '[]')
    localStorage.setItem('events', JSON.stringify(allEvents.filter((e: Event) => e.id !== id)))
    setEvents(events.filter(e => e.id !== id))
  }

  const isUpcoming = (date: Date) => new Date(date) > new Date()

  const filteredAndSortedEvents = events
    .filter(e => filterBranch === 'all' || e.branchId === filterBranch)
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.title.localeCompare(b.title)
      } else {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleInviteClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setShowInviteModal(true)
  }

  const handleInviteSuccess = (newInvitations: EventInvitation[], eventId: string) => {
    if (!newInvitations.length) return

    try {
      setIsInviting(true)
      // Update localStorage
      const allEvents: Event[] = JSON.parse(localStorage.getItem('events') || '[]')

      const updatedEvents = allEvents.map((event: Event) => {
        if (event.id === eventId) {
          const currentInvitations = event.invitations || []
          return {
            ...event,
            invitations: [...currentInvitations, ...newInvitations]
          }
        }
        return event
      })

      localStorage.setItem('events', JSON.stringify(updatedEvents))

      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, invitations: [...(event.invitations || []), ...newInvitations] }
            : event
        )
      )

      // Optional: Show success toast/notification
      // You can replace this with a proper toast library later
      alert(`✅ ${newInvitations.length} invitation(s) sent successfully!`)
    } catch (err) {
      console.error('Error occurred', err)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage union events and gatherings</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Filter Controls */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className='flex flex-wrap gap-2'>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'date')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Event Name</SelectItem>
                  <SelectItem value="date">Event Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Label>Sort Order</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Label>Filter by Branch</Label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Event Title</Label>
                <Input
                  placeholder="Annual General Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                placeholder="Conference Room"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Event description and additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* === IMAGES WITH CAPTIONS === */}
            <div className="border rounded-xl p-5 bg-muted/30">
              <Label className="text-lg font-semibold mb-4 block">Event Images</Label>
              <div className="flex gap-3 mb-4 items-end">
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('event-image-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {imageFile ? imageFile.name : 'Upload Image'}
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
                  placeholder="Image Caption (optional)"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addImage} disabled={!imageFile}>Add Image</Button>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="border rounded-xl p-4 bg-white">
                      <img src={img.url} alt={img.caption || "Event Image"} className="w-full h-32 object-cover rounded mb-2" />
                      {img.caption && <p className="text-sm text-muted-foreground mb-2">{img.caption}</p>}
                      <Button variant="ghost" size="sm" onClick={() => removeImage(idx)} className="text-destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === FILES WITH CAPTIONS === */}
            <div className="border rounded-xl p-5 bg-muted/30">
              <Label className="text-lg font-semibold mb-4 block">Attached Files</Label>
              <div className="flex gap-3 mb-4 items-end">
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('event-file-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {fileFile ? fileFile.name : 'Upload File'}
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
                  placeholder="File Caption (optional)"
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addFile} disabled={!fileFile}>Add File</Button>
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="border rounded-xl p-4 bg-white">
                      <p className="font-semibold text-sm truncate">{file.name}</p>
                      {file.caption && <p className="text-sm text-muted-foreground mb-2">{file.caption}</p>}
                      <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="text-destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === STAKEHOLDERS WITH IMAGE UPLOAD & PREVIEW === */}
            <div className="border rounded-xl p-5 bg-muted/30">
              <Label className="text-lg font-semibold mb-4 block">Stakeholders</Label>

              <div className="flex gap-3 mb-6">
                <Input
                  placeholder="Full Name"
                  value={newStakeholder.name}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                />
                <Input
                  placeholder="Profession / Position"
                  value={newStakeholder.profession}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, profession: e.target.value })}
                />

                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => document.getElementById('stakeholder-photo')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {newStakeholder.imageFile ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <input
                    id="stakeholder-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                <Button onClick={addStakeholder} disabled={!newStakeholder.name || !newStakeholder.profession}>Add Stakeholder</Button>
              </div>

              {/* Current Stakeholder Image Preview */}
              {newStakeholder.previewUrl && (
                <div className="mb-6 p-4 border rounded-lg bg-white">
                  <p className="text-sm text-muted-foreground font-medium mb-3">Selected Photo Preview:</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={newStakeholder.previewUrl}
                      alt="Preview"
                      className="w-28 h-28 rounded-2xl object-cover border shadow-md"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Ready to add</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-red-600 hover:text-red-700"
                        onClick={() => setNewStakeholder(prev => ({ ...prev, imageFile: null, previewUrl: '' }))}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Added Stakeholders Preview Grid */}
              {stakeholders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stakeholders.map((sh) => (
                    <div key={sh.id} className="border rounded-xl p-4 flex gap-4 items-center bg-white">
                      {sh.image ? (
                        <img
                          src={sh.image}
                          alt={sh.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                          👤
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-muted-foreground">{sh.name}</p>
                        <p className="text-sm text-muted-foreground">{sh.profession}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStakeholder(sh.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddEvent} size="lg">Create Event</Button>
              <Button variant="outline" size="lg" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event lists */}
      <div className="grid gap-4">
        {filteredAndSortedEvents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {events.length === 0 ? 'No events found' : 'No events match your filters'}
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      {isUpcoming(event.date) ? (
                        <Badge>Upcoming</Badge>
                      ) : (
                        <Badge variant="secondary">Past</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>

                {event.notes && <p className="mb-5">{event.notes}</p>}

                {/* Stakeholders Preview */}
                {event.stakeholders?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> STAKEHOLDERS ({event.stakeholders.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {event.stakeholders.map((name, i) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Share Event</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        window.open(`mailto:?subject=${event.title}&body=${text}`, '_blank')
                      }}
                      title="Share via Email"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      title="Share via WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodeURIComponent(text)}`, '_blank')
                      }}
                      title="Share on Facebook"
                    >
                      <img src={Facebook.src} alt="F" className="w-3 h-3" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      title="Share on Twitter"
                    >
                      <img src={Twitter.src} alt="X" className='w-3 h-3' />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
                      }}
                      title="Share via SMS"
                    >
                      <MessageCircle className="w-3 h-3" />
                      SMS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                        if (navigator.share) {
                          navigator.share({
                            title: event.title,
                            text: text,
                            url: window.location.href
                          })
                        }
                      }}
                      title="More sharing options"
                    >
                      <Share2 className="w-3 h-3" />
                      More
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleInviteClick(event.id)}
                    title="Invite people"
                  >
                    <Users className="w-3 h-3" />
                    Invite ({event.invitations?.length || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <EventInviteModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          onSubmit={(invitations) => {
            if (selectedEventId) {
              handleInviteSuccess(invitations, selectedEventId)
            }
          }}
          isLoading={false}
          existingInvitations={
            events.find(e => e.id === selectedEventId)?.invitations || []
          }
        />
      </div>
    </div >
  )
}
