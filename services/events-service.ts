
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Event, EventFile, EventInvitation, EventParticipant, AttendanceStatus,
  EventAttendance, BulkEventInvitation
} from "@/lib/types";

// Get all events
export async function getEvents(
  supabase: SupabaseClient
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Event[];
}

// Get event by ID
export async function getEventById(
  supabase: SupabaseClient,
  id: string
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Event;
}

// Get events by branch
export async function getEventsByBranch(
  supabase: SupabaseClient,
  branchId: string
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("branch_id", branchId)
    .order("event_date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Event[];
}

// Get events by affiliate
export async function getEventsByAffiliate(
  supabase: SupabaseClient,
  affiliateId: string
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("event_date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Event[];
}

// Create event
export async function createEvent(
  supabase: SupabaseClient,
  payload: Pick<Event, "branch_id" | "affiliate_id" | "title" | "notes" | "event_date" | "location" | "stakeholders">,
  userId?: string
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...payload,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Event;
}

/** Upload an event attachment to Supabase Storage and persist its metadata. */
export async function uploadEventFile(
  supabase: SupabaseClient,
  eventId: string,
  file: File,
  kind: EventFile["file_kind"]
): Promise<EventFile> {
  const path = `${eventId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("event-files")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("event-files").getPublicUrl(path);
  try {
    return await createEventFile(supabase, {
      event_id: eventId,
      file_kind: kind,
      name: file.name,
      url: urlData.publicUrl,
      mime_type: file.type || null,
      uploaded_at: new Date().toISOString(),
    });
  } catch (error) {
    await supabase.storage.from("event-files").remove([path]);
    throw error;
  }
}

// Update event
export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Event>
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Event;
}

// Delete event
export async function deleteEvent(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==========================================
// EVENT FILES
// ==========================================

// Get event files
export async function getEventFiles(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventFile[]> {
  const { data, error } = await supabase
    .from("event_files")
    .select("*")
    .eq("event_id", eventId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as EventFile[];
}

// Add event file metadata
export async function createEventFile(
  supabase: SupabaseClient,
  payload: Omit<EventFile, "id">
): Promise<EventFile> {
  const { data, error } = await supabase
    .from("event_files")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data as EventFile;
}

// Update event file metadata
export async function updateEventFile(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<EventFile>
): Promise<EventFile> {
  const { data, error } = await supabase
    .from("event_files")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as EventFile;
}

// Delete event file metadata
export async function deleteEventFile(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("event_files")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==========================================
// EVENT INVITATIONS
// ==========================================

// Get invitations for an event
export async function getEventInvitations(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventInvitation[]> {
  const { data, error } = await supabase
    .from("event_invitations")
    .select("*")
    .eq("event_id", eventId)
    .order("sent_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as EventInvitation[];
}

// Create invitation
export async function createEventInvitation(
  supabase: SupabaseClient,
  payload: EventInvitation
): Promise<EventInvitation> {
  const { data, error } = await supabase
    .from("event_invitations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data as EventInvitation;
}

// Create multiple event invitations at once
export async function createBulkEventInvitations(
  supabase: SupabaseClient,
  payload: BulkEventInvitation
): Promise<EventInvitation[]> {

  if (!payload.invitations.length) {
    throw new Error("At least one invitation is required.");
  }

  const invitations = payload.invitations.map((invite) => {
    if (!invite.email?.trim() && !invite.phone?.trim()) {
      throw new Error(
        `An email address or phone number is required for ${invite.name}.`
      );
    }

    return {
      event_id: payload.event_id,
      name: invite.name.trim(),
      email: invite.email?.trim() || null,
      phone: invite.phone?.trim() || null,
      status: "invited" as const,
    };
  });

  const { data, error } = await supabase
    .from("event_invitations")
    .insert(invitations)
    .select();

  if (error) {
    console.error("Error creating bulk invitations:", error);
    throw error;
  }

  return (data ?? []) as EventInvitation[];
}

// Update invitation status
export async function updateEventInvitationStatus(
  supabase: SupabaseClient,
  id: string,
  status: EventInvitation["status"]
): Promise<EventInvitation> {
  const { data, error } = await supabase
    .from("event_invitations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as EventInvitation;
}

// Delete invitation
export async function deleteEventInvitation(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("event_invitations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==========================================
// EVENT PARTICIPANTS
// ==========================================

// Get all participants for an event
export async function getEventParticipants(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventParticipant[]> {
  const { data, error } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as EventParticipant[];
}

// Get participant by ID
export async function getEventParticipantById(
  supabase: SupabaseClient,
  id: string
): Promise<EventParticipant> {
  const { data, error } = await supabase
    .from("event_participants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as EventParticipant;
}

// Register participant
export async function createEventParticipant(
  supabase: SupabaseClient,
  payload: EventParticipant
): Promise<EventParticipant> {
  const { data, error } = await supabase
    .from("event_participants")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data as EventParticipant;
}

// Update participant
export async function updateEventParticipant(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<EventParticipant>
): Promise<EventParticipant> {
  const { data, error } = await supabase
    .from("event_participants")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as EventParticipant;
}

// Cancel participant registration
export async function cancelEventParticipant(
  supabase: SupabaseClient,
  id: string
): Promise<EventParticipant> {
  return updateEventParticipant(supabase, id, {
    registration_status: "cancelled",
  });
}

// Delete participant
export async function deleteEventParticipant(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==========================================
// EVENT ATTENDANCE
// ==========================================

// Get attendance for an event
export async function getEventAttendance(
  supabase: SupabaseClient,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_participants")
    .select(`
      *,
      event_attendance (*)
    `)
    .eq("event_id", eventId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data;
}

// Get attendance by participant
export async function getParticipantAttendance(
  supabase: SupabaseClient,
  participantId: string
): Promise<EventAttendance | null> {
  const { data, error } = await supabase
    .from("event_attendance")
    .select("*")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (error) throw error;

  return data as EventAttendance | null;
}

// Mark participant attendance
export async function markEventAttendance(
  supabase: SupabaseClient,
  participantId: string,
  status: AttendanceStatus,
  userId?: string,
  notes: string = ""
): Promise<EventAttendance> {
  const { data, error } = await supabase
    .from("event_attendance")
    .upsert(
      {
        participant_id: participantId,
        attendance_status: status,
        notes,
        marked_by: userId ?? null,
        marked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "participant_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data as EventAttendance;
}

// Update attendance
export async function updateEventAttendance(
  supabase: SupabaseClient,
  id: string,
  payload: {
    attendance_status?: AttendanceStatus;
    notes?: string;
  },
  userId?: string
): Promise<EventAttendance> {
  const { data, error } = await supabase
    .from("event_attendance")
    .update({
      ...payload,
      marked_by: userId ?? null,
      marked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as EventAttendance;
}

// Delete attendance record
export async function deleteEventAttendance(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("event_attendance")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
