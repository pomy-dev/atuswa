import { SupabaseClient } from '@supabase/supabase-js'
import { HelpDeskCase, CaseHandler, CaseNote, CaseDocument, HelpDeskStatus } from '@/lib/types'

export async function createHelpdeskCase(
  supabase: SupabaseClient,
  data: Omit<
    HelpDeskCase,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'status'
    | 'handlers'
    | 'documents'
    | 'notes'
    | 'created_by'
    | 'created_by_name'
  >
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  const { data: newCase, error } = await supabase
    .from('helpdesk_cases')
    .insert({
      ...data,
      ...data,
      branch_id: data.branch_id === '' ? null : data.branch_id,
      affiliate_id: data.affiliate_id === '' ? null : data.affiliate_id,
      created_by: user.id,
      created_by_name: profile.full_name,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  return newCase
}

export async function getHelpdeskCases(
  supabase: SupabaseClient
) {
  const { data, error } = await supabase
    .from('helpdesk_cases')
    .select(`
      *,
      handlers:helpdesk_handlers(*),
      documents:helpdesk_documents(*),
      notes:helpdesk_notes(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((item) => ({
    ...item,

    handlers: (item.handlers ?? []).map((handler: CaseHandler) => ({
      user_id: handler.user_id,
      user_name: handler.user_name,
      handled_at: new Date(handler.handled_at),
      action: handler.action,
    })),

    documents: (item.documents ?? []).map((document: CaseDocument) => ({
      id: document.id,
      name: document.name,
      url: document.url,
      uploaded_at: document.uploaded_at ? new Date(document.uploaded_at) : undefined,
    })),

    notes: (item.notes ?? []).map((note: CaseNote) => ({
      id: note.id,
      content: note.content,
      created_by: note.created_by,
      created_by_name: note.created_by_name,
      created_at: new Date(note.created_at),
    })),

    created_at: new Date(item.created_at),
    updated_at: new Date(item.updated_at),
  })) as HelpDeskCase[]
}

export async function getHelpdeskCaseById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('helpdesk_cases')
    .select(`
      *,
      handlers:helpdesk_handlers(*),
      documents:helpdesk_documents(*),
      notes:helpdesk_notes(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...data,
    handlers: (data.handlers ?? []).map((handler: CaseHandler) => ({
      user_id: handler.user_id,
      user_name: handler.user_name,
      handled_at: new Date(handler.handled_at),
      action: handler.action,
    })),
    documents: (data.documents ?? []).map((document: CaseDocument) => ({
      id: document.id,
      name: document.name,
      url: document.url,
      uploaded_at: document.uploaded_at ? new Date(document.uploaded_at) : undefined,
    })),
    notes: (data.notes ?? []).map((note: CaseNote) => ({
      id: note.id,
      content: note.content,
      created_by: note.created_by,
      created_by_name: note.created_by_name,
      created_at: new Date(note.created_at),
    })),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  } as HelpDeskCase
}

export async function deleteHelpdeskCase(supabase: SupabaseClient, id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify that the current user created this case
  const { data: existingCase, error: fetchError } = await supabase
    .from('helpdesk_cases')
    .select('id, created_by')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (existingCase.created_by !== user.id) {
    throw new Error('You are not authorized to delete this case.')
  }

  // Delete the case
  const { error: deleteError } = await supabase
    .from('helpdesk_cases')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (deleteError) throw deleteError

  return true
}

export async function updateHelpdeskCaseStatus(
  supabase: SupabaseClient,
  id: string,
  status: HelpDeskStatus,
  actionBy: { id: string; name: string }
) {
  const { error: updateError } = await supabase
    .from('helpdesk_cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) throw updateError

  const { error: handlerError } = await supabase
    .from('helpdesk_handlers')
    .insert({
      case_id: id,
      user_id: actionBy.id,
      user_name: actionBy.name,
      action: `Status updated to ${status.replace('_', ' ')}`,
    })
  if (handlerError) throw handlerError
}

export async function addHelpdeskCaseNote(
  supabase: SupabaseClient,
  id: string,
  note: { content: string; created_by: string; created_by_name: string }
) {
  const { data, error } = await supabase
    .from('helpdesk_notes')
    .insert({ case_id: id, ...note })
    .select()
    .single()
  if (error) throw error
  return data as CaseNote
}
