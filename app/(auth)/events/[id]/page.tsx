'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Event, EventFile, EventInvitation } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { deleteEvent, deleteEventInvitation, getEventById, getEventFiles, getEventInvitations, updateEvent, updateEventInvitationStatus } from '@/services/events-service'
import { EventInviteModal } from '@/components/modals/event-invite-modal'
import { toast } from 'sonner'
import { ChevronLeft, Calendar, MapPin, Trash2, Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [files, setFiles] = useState<EventFile[]>([])
  const [invitations, setInvitations] = useState<EventInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    const [loadedEvent, loadedFiles, loadedInvitations] = await Promise.all([
      getEventById(supabase, params.id), getEventFiles(supabase, params.id), getEventInvitations(supabase, params.id),
    ])
    setEvent(loadedEvent)
    setFiles(loadedFiles)
    setInvitations(loadedInvitations)
  }, [params.id])

  useEffect(() => {
    let active = true
    const run = async () => {
      try { await load() }
      catch (error) { if (active) toast.error(error instanceof Error ? error.message : 'Could not load event.') }
      finally { if (active) setLoading(false) }
    }
    void run()
    return () => { active = false }
  }, [load])

  const sendInvitations = async (items: EventInvitation[]) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase || !items.length) return
    setWorking(true)
    try {
      const { createBulkEventInvitations } = await import('@/services/events-service')
      await createBulkEventInvitations(supabase, { event_id: params.id, invitations: items.map(({ name, email, phone }) => ({ name, email, phone })) })
      await load()
      toast.success('Invitations saved.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save invitations.') }
    finally { setWorking(false) }
  }

  const removeInvitation = async (id: string) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    try { await deleteEventInvitation(supabase, id); setInvitations((current) => current.filter((item) => item.id !== id)); toast.success('Invitation removed.') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove invitation.') }
  }

  const changeInvitation = async (invitation: EventInvitation, status: EventInvitation['status']) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    try {
      const updated = await updateEventInvitationStatus(supabase, invitation.id, status)
      setInvitations((current) => current.map((item) => item.id === updated.id ? updated : item))
      toast.success('Invitation updated.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update invitation.') }
  }

  const removeEvent = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    if (!confirm("Are you sure to delete event? This action is irreversible!")) return
    setWorking(true)
    try { await deleteEvent(supabase, params.id); toast.success('Event deleted.'); router.push('/events') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete event.') }
    finally { setWorking(false) }
  }

  if (loading) return <div className="flex flex-wrap p-6"><Spinner className='h-6 w-6' />{"  "}Loading event...</div>
  if (!event) return <div className="p-6"><Button variant="ghost" onClick={() => router.push('/events')}><ChevronLeft className="mr-2 h-4 w-4" />Events</Button><p>Event not found.</p></div>
  const images = files.filter((file) => file.file_kind === 'image')
  const documents = files.filter((file) => file.file_kind === 'document')

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Button variant="ghost" className="-ml-3 mb-2" onClick={() => router.push('/events')}><ChevronLeft className="mr-1 h-4 w-4" />Back to Events</Button>
          <h1 className="text-3xl font-semibold">{event.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(event.event_date).toLocaleString()}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</span></div>
        </div>
        <Button variant="destructive" onClick={removeEvent} disabled={working}><Trash2 className="mr-2 h-4 w-4" />Delete event</Button>
      </div>
      <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{event.notes || 'No notes provided.'}</CardContent></Card>
      {event?.stakeholders?.length! > 0 && <Card><CardHeader><CardTitle>Stakeholders</CardTitle></CardHeader><CardContent>{event.stakeholders!.join(', ')}</CardContent></Card>}
      {images.length > 0 && <Card><CardHeader><CardTitle>Images ({images.length})</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((file) => file.url && <a key={file.id} href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt={file.name} className="h-40 w-full rounded-md border object-cover" /><p className="truncate text-xs">{file.name}</p></a>)}</CardContent></Card>}
      {documents.length > 0 && <Card><CardHeader><CardTitle>Documents ({documents.length})</CardTitle></CardHeader><CardContent className="space-y-2">{documents.map((file) => <div key={file.id} className="flex justify-between rounded border p-3"><span>{file.name}</span>{file.url && <a className="text-primary underline" href={file.url} target="_blank" rel="noreferrer">Open</a>}</div>)}</CardContent></Card>}
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Invitations ({invitations.length})</CardTitle><Button onClick={() => setInviteOpen(true)}>Invite people</Button></CardHeader><CardContent className="divide-y">{invitations.length === 0 ? <p className="text-sm text-muted-foreground">No invitations yet.</p> : invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{invitation.name}</p><p className="text-sm text-muted-foreground">{invitation.email || invitation.phone}</p></div><div className="flex items-center gap-2"><Badge variant="secondary">{invitation.status}</Badge>{invitation.status === 'invited' && <><Button size="sm" variant="outline" onClick={() => changeInvitation(invitation, 'accepted')}>Accepted</Button><Button size="sm" variant="outline" onClick={() => changeInvitation(invitation, 'declined')}>Declined</Button></>}<Button size="sm" variant="ghost" onClick={() => removeInvitation(invitation.id)}>Remove</Button></div></div>)}</CardContent></Card>
      <EventInviteModal open={inviteOpen} onOpenChange={setInviteOpen} onSubmit={sendInvitations} isLoading={working} existingInvitations={invitations} />
    </main>
  );
}
