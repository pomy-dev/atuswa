
import { SupabaseClient } from '@supabase/supabase-js'
import type { EFileFolder, EFile, } from '@/lib/types'

const STORAGE_BUCKET = 'e-files'

// 1. CREATE FOLDER
export async function createEFileFolder(
  supabase: SupabaseClient,
  input: EFileFolder
): Promise<EFileFolder> {
  console.log(input)
  const userId = input.user_id?.trim()
  if (!userId) throw new Error('Cannot create a folder without an authenticated user.')

  const { data, error } = await supabase
    .from('efile_folders')
    .insert({
      name: input.name,
      user_id: userId,
      branch_id: input.branch_id?.trim() || null,
      affiliate_id: input.affiliate_id?.trim() || null,
      notes: input.notes ?? null
    })
    .select()
    .single()

  if (error) throw error

  return data as EFileFolder
}

// 2. GET ALL FOLDERS
export async function getAllEFileFolders(
  supabase: SupabaseClient,
  branchId?: string | null
): Promise<EFileFolder[]> {

  let query = supabase
    .from('efile_folders')
    .select('*')
    .order('created_at', { ascending: false })

  if (branchId?.trim()) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as EFileFolder[]
}

// 3. GET FOLDER BY ID
export async function getEFileFolderById(
  supabase: SupabaseClient,
  id: string
): Promise<EFileFolder> {

  const { data, error } = await supabase
    .from('efile_folders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as EFileFolder
}

// 4. UPDATE FOLDER
export async function updateEFileFolder(
  supabase: SupabaseClient,
  id: string,
  updates: EFileFolder
): Promise<EFileFolder> {

  const { data, error } = await supabase
    .from('efile_folders')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data as EFileFolder
}

// 5. DELETE FOLDER
export async function deleteEFileFolder(
  supabase: SupabaseClient,
  id: string
): Promise<void> {

  const { error } = await supabase
    .from('efile_folders')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function uploadEFile(
  supabase: SupabaseClient,
  input: EFile
): Promise<EFile> {
  const {
    file,
    branch_id = null,
    folder_id = null,
    name
  } = input

  // Get authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('User is not authenticated')

  // Generate unique storage path
  const fileName = file?.name.replace(/[^a-zA-Z0-9._-]/g, '_')

  const storagePath = [
    branch_id ?? 'unassigned',
    crypto.randomUUID(),
    `${fileName}-${Date.now()}`
  ].join('/')

  // Upload physical file
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file!, {
      contentType: file?.type || 'application/octet-stream',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Insert metadata
  const { data, error } = await supabase
    .from('efiles')
    .insert({
      branch_id,
      folder_id,
      name: name?.trim() || file?.name,
      mime_type: file?.type || 'application/octet-stream',
      size_bytes: file?.size,
      uploaded_by: user.id,
      storage_path: storagePath
    })
    .select('*')
    .single()

  // Roll back Storage upload if database insert fails
  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath])

    if (cleanupError) {
      console.error('Storage cleanup failed:', cleanupError)
    }

    throw error
  }

  return data as EFile
}

export async function getAllEFiles(
  supabase: SupabaseClient,
  branchId?: string,
  folderId?: string
): Promise<EFile[]> {

  let query = supabase
    .from('efiles')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  if (folderId) {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as EFile[]
}

export async function getEFileById(
  supabase: SupabaseClient,
  id: string
): Promise<EFile> {
  const { data, error } = await supabase
    .from('efiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as EFile
}

export async function updateEFile(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<EFile>
): Promise<EFile> {
  const { folder_id, name, branch_id } = updates
  const { data, error } = await supabase
    .from('efiles')
    .update({ folder_id, name, branch_id })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data as EFile
}

export async function deleteEFile(
  supabase: SupabaseClient,
  id: string
): Promise<void> {

  const document = await getEFileById(supabase, id)

  if (document.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([document.storage_path])

    if (storageError) throw storageError
  }

  const { error } = await supabase
    .from('efiles')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getEFileSignedUrl(
  supabase: SupabaseClient,
  id: string,
  expiresIn = 3600
): Promise<string> {
  const document = await getEFileById(supabase, id)

  if (!document.storage_path) {
    throw new Error('Document has no Storage path')
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(document.storage_path, expiresIn)

  if (error) throw error

  return data.signedUrl
}
