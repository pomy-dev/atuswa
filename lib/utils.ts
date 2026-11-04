import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { Permission, Role } from './types'

export async function getAllPermissions(client: SupabaseClient, session: Session | null) {
  if (!session?.user) return null

  const { data, error } = await client
    .rpc('get_all_permissions');

  if (error) throw new Error(`Unable to load your account profile: ${error.message}`)

  // console.log('Fetched permissions:', data);

  const permissions: Permission[] = data.map((permission: any) => ({
    id: permission.id,
    label: permission.label,
    description: permission.description ?? undefined
  }));

  return permissions;
}

export async function createRole(client: SupabaseClient, session: Session | null, input: Role) {
  if (!session?.user) return null

  const { data, error } = await client.rpc('create_role', {
    p_role_name: input.name,
    p_description: input.description ?? null,
    p_permissions: input.permissions
  });

  if (error) {
    console.error('Error creating role:', error.message);
    throw error;
  }

  return data;
}

export async function updateRole(client: SupabaseClient, session: Session | null, input: Role) {
  if (!session?.user) return null
  const { data, error } = await client.rpc('update_role', {
    p_role_id: input.id,
    p_role_name: input.name,
    p_description: input.description ?? null,
    p_permissions: input.permissions
  });
  if (error) {
    console.error('Error updating role:', error.message);
    throw error;
  }
  return data;
}

export async function getAllRoles(client: SupabaseClient, session: Session | null) {
  if (!session?.user) return null

  const { data, error } = await client
    .rpc('get_all_roles');

  if (error) throw new Error(`Unable to load your roles: ${error.message}`)

  // console.log('Fetched roles:', data);

  const roles: Role[] = data.map((role: any) => ({
    id: role.id,
    name: role.role_name,
    description: role.description ?? undefined,
    permissions: role.permissions ?? [],
    createdAt: role.created_at
  }));

  return roles;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatLabel = (value: string) => {
  return value
    .replace(/_/g, ' ') // Replace all underscores with spaces
    .split(' ') // Split by spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join back with spaces
};