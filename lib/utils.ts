
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { Permission, Role } from './types'

export async function getAllPermissions(client: SupabaseClient, session: Session | null) {
  if (!session?.user) return null

  const { data, error } = await client
    .rpc('get_all_permissions');

  if (error) throw new Error(`Unable to load your account profile: ${error.message}`)

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
    p_permissions: input.permissions,
    p_accesses: input.accesses
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
    p_permissions: input.permissions,
    p_accesses: input.accesses
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

  const roles: Role[] = data.map((role: any) => ({
    id: role.id,
    name: role.role_name,
    description: role.description ?? undefined,
    permissions: role.permissions ?? [],
    accesses: role.accesses ?? [],
    createdAt: role.created_at
  }));

  return roles;
}

export async function getRoleById(client: SupabaseClient, session: Session | null, roleId: string) {
  if (!session?.user) return null
  const { data, error } = await client
    .rpc('get_role_by_id', { p_role_id: roleId });

  if (error) throw new Error(`Unable to load the role: ${error.message}`)

  if (!data || data.length === 0) return null

  const roleData = data[0];

  const role: Role = {
    id: roleData.id,
    name: roleData.role_name,
    description: roleData.description ?? undefined,
    permissions: roleData.permissions ?? [],
    accesses: roleData.accesses ?? [],
    createdAt: roleData.created_at
  };

  return role;
}

export async function getAccessesByRoleName(client: SupabaseClient, session: Session | null, roleName: string) {
  if (!session?.user) return null
  const { data, error } = await client
    .rpc('get_accesses_by_role_name', { p_role_name: roleName });

  if (error) throw new Error(`Unable to load accesses for the role: ${error.message}`)

  if (!data || data.length === 0) return []

  const accesses: string[] = data.map((access: any) => access);

  return accesses;
}