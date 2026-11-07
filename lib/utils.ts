import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { Permission, Role, AppUser } from './types'

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

export async function createUserAccount(client: SupabaseClient, session: Session | null, payload: {
  full_name: string
  email: string
  phone?: string
  role_id: string
  branch_id?: string
  photo_url?: string | null
}) {
  if (!session?.user) return null

  const { data, error } = await client.functions.invoke(
    "create-user-account",
    {
      body: payload,
    }
  );

  if (error) {
    console.error("Edge Function error:", error);

    // Extract the actual response from Supabase
    if (error.context instanceof Response) {
      const errorDetails = await error.context.json();

      console.error("Actual server error:", errorDetails);

      throw new Error(
        errorDetails.message || "Unable to create user account."
      );
    }

    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(
      data?.message || "Unable to create user account."
    );
  }

  console.log("User created successfully:", data.user);

  return data.user;
}

export async function getAllUsersWithRoles(client: SupabaseClient, session: Session | null) {
  if (!session?.user) return null
  const { data, error } = await client
    .rpc('get_profiles_with_roles');

  if (error) throw new Error(`Unable to load users with roles: ${error.message}`)

  const users: AppUser[] = data.map((user: any) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role_id: user.role_id,
    status: user.status,
    createdAt: user.created_at,
    lastLogin: user.last_login ?? undefined,
    role: user.role_id ? {
      id: user.role_id,
      name: user.role?.role_name,
      permissions: user.role?.permissions ?? [],
    } : undefined
  }));

  return users;
}

export async function getUserById(client: SupabaseClient, session: Session | null, userId: string) {
  if (!session?.user) return null
  const { data, error } = await client
    .rpc('get_profiles_with_roles', { p_profile_id: userId });

  if (error) throw new Error(`Unable to load the user: ${error.message}`)

  if (!data || data.length === 0) return null

  const userData = data[0];

  const user: AppUser = {
    id: userData.id,
    full_name: userData.full_name,
    email: userData.email,
    role_id: userData.role_id,
    status: userData.status,
    createdAt: userData.created_at,
    lastLogin: userData.last_login ?? undefined,
    role: userData.role_id ? {
      id: userData.role_id,
      name: userData.role?.role_name,
      accesses: userData.role?.accesses ?? [],
      permissions: userData.role?.permissions ?? [],
      createdAt: userData.role?.created_at
    } : undefined
  };
  return user;
}

export async function updateUserAccount(client: SupabaseClient, session: Session | null, payload: {
  user_id: string
  full_name: string
  email: string
  phone: string
  role_id: string
  branch_id?: string
  photo_url?: string | null
  status: string
}) {
  if (!session?.user) return null

  const { data, error } = await client.functions.invoke(
    "update-user-account",
    {
      body: payload,
    }
  );

  if (error) throw new Error(`Unable to update user account: ${error.message}`)

  return data.user;
}

export async function resendInvitation(client: SupabaseClient, session: Session | null, profileId: string) {
  if (!session?.user) return null;

  const { data, error } = await client.functions.invoke(
    "resend-user-invitation",
    {
      body: {
        profile_id: profileId,
      },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    }
  );

  if (error) {
    let message = error.message;

    if (error.context instanceof Response) {
      const response = await error.context.json();
      message = response.error || message;
    }

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Could not resend invitation.");
  }

  return data;
}

export async function deleteUserAccount(client: SupabaseClient, session: Session | null, profileId: string) {

  const { data, error } = await client.functions.invoke(
    "delete-user-account",
    {
      body: {
        profile_id: profileId,
      },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    }
  );

  if (error) {
    let message = error.message;

    if (error.context instanceof Response) {
      const response = await error.context.json();
      message = response.error || message;
    }

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Failed to delete user account."
    );
  }

  return data;
}