'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContextType, User } from './types'
import { getSupabaseBrowserClient } from './supabase/client'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function configurationError() {
  return new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
}

async function mapSessionToUser(client: SupabaseClient, session: Session | null): Promise<User | null> {
  if (!session?.user) return null

  const { data: profile, error } = await client
    .rpc('get_profiles_with_roles', {
      p_profile_id: session?.user.id
    });

  if (error) throw new Error(`Unable to load your account profile: ${error.message}`)

  return {
    id: profile[0].id,
    email: session.user.email ?? '',
    name: profile[0].full_name,
    role: profile[0].role?.role_name ?? 'user',
    branchId: profile[0].branch_id ?? '',
    photo: profile[0].photo_url ?? undefined,
    createdAt: new Date(profile[0].created_at)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hydrateSession = useCallback(async (supabase: SupabaseClient, session: Session | null) => {
    try {
      setUser(await mapSessionToUser(supabase, session))
    } catch (error) {
      console.error(error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!client) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    void client.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore Supabase session:', error.message)
      if (isMounted) void hydrateSession(client, data.session)
    })

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      // Let the auth callback finish before querying the profile with the same client.
      queueMicrotask(() => {
        if (isMounted) void hydrateSession(client, session)
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [client, hydrateSession])

  const login = async (email: string, password: string) => {
    if (!client) throw configurationError()
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    const profileUser = await mapSessionToUser(client, data.session)
    if (!profileUser) throw new Error('Supabase did not return an authenticated session.')
    setUser(profileUser)
    setIsLoading(false)
    return profileUser
  }

  const logout = async () => {
    if (!client) throw configurationError()
    const { error } = await client.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const register = async (email: string, name: string, password: string) => {
    if (!client) throw configurationError()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) throw error
    if (data.session) {
      const profileUser = await mapSessionToUser(client, data.session)
      setUser(profileUser)
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!client) throw configurationError()
    if (!user?.email) throw new Error('You must be signed in to change your password.')

    const { error: verifyError } = await client.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })
    if (verifyError) throw new Error('Current password is incorrect.')

    const { error } = await client.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    register,
    updatePassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
