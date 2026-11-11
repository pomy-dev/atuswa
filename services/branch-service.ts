
import { SupabaseClient } from '@supabase/supabase-js'
import type { Branch, AssignBranchAdminResponse } from '@/lib/types'

// 1. CREATE BRANCH
export async function createBranch(
  supabase: SupabaseClient,
  data: Branch
): Promise<Branch> {

  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      branch_name: data.name,
      location: data.location,
      contact_email: data.contactEmail ?? null
    })
    .select('*')
    .single()

  if (error) throw error

  return branch as Branch
}

// 2. GET ALL BRANCHES
export async function getAllBranches(
  supabase: SupabaseClient
): Promise<Branch[]> {

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as Branch[]
}

// 3. GET BRANCH BY ID
export async function getBranchById(
  supabase: SupabaseClient,
  id: string
): Promise<Branch> {

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as Branch
}

// 4. UPDATE BRANCH
export async function updateBranch(
  supabase: SupabaseClient,
  id: string,
  updates: Branch
): Promise<Branch> {

  console.log("3", updates)

  const updatedInfo = {
    branch_name: updates.name,
    contact_email: updates?.contactEmail,
    is_active: updates.isActive,
    admin_id: updates?.adminId,
    location: updates.location
  }

  const { data, error } = await supabase
    .from('branches')
    .update(updatedInfo)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data as Branch
}

// 5. DELETE BRANCH
export async function deleteBranch(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  let isError = false;

  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)

  if (error) {
    isError = true
    throw error
  }

  return isError
}

// 6. ACTIVATE BRANCH
export async function activateBranch(
  supabase: SupabaseClient,
  id: string
): Promise<Branch> {

  const { data, error } = await supabase
    .from('branches')
    .update({ is_active: true })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data as Branch
}

// 7. DEACTIVATE BRANCH
export async function deactivateBranch(
  supabase: SupabaseClient,
  id: string
): Promise<Branch> {

  const { data, error } = await supabase
    .from('branches')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data as Branch
}

// 8. ASSIGN BRANCH ADMINISTRATOR
// export async function assignBranchAdmin(
//   supabase: SupabaseClient,
//   branchId: string,
//   userId: string
// ): Promise<Branch> {

//   const { data, error } = await supabase
//     .from('branches')
//     .update({ admin_id: userId })
//     .eq('id', branchId)
//     .select('*')
//     .single()

//   if (error) throw error

//   return data as Branch
// }

export async function assignBranchAdmin(
  supabase: SupabaseClient,
  branchId: string,
  userId: string
): Promise<AssignBranchAdminResponse> {

  const { data, error } = await supabase.functions.invoke(
    'assign-branch-admin',
    {
      body: {
        branchId,
        userId
      }
    }
  )

  if (error) {
    console.error('Edge Function error:', error)

    // Extract the actual response from Supabase
    if ('context' in error && error.context instanceof Response) {
      const response = error.context

      let errorDetails: unknown

      try {
        errorDetails = await response.json()
      } catch {
        errorDetails = await response.text()
      }

      console.error('Function response:', errorDetails)
      console.error('HTTP status:', response.status)

      throw new Error(
        typeof errorDetails === 'object' &&
          errorDetails !== null &&
          'error' in errorDetails
          ? String(errorDetails.error)
          : 'Failed to assign branch administrator'
      )
    }

    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Failed to assign branch administrator'
    )
  }

  return data
}

// 9. REMOVE BRANCH ADMINISTRATOR
export async function removeBranchAdmin(
  supabase: SupabaseClient,
  branchId: string
): Promise<Branch> {

  const { data, error } = await supabase
    .from('branches')
    .update({ admin_id: null })
    .eq('id', branchId)
    .select('*')
    .single()

  if (error) throw error

  return data as Branch
}