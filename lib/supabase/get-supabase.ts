import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from './client';

export function useSupabase() {
  const [supabase, setSupabase] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const getSupabaseClient = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')

        const { data: { session }, error } = await supabase.auth.getSession()
        setSupabase(supabase)
        if (error) {
          setError(error)
          throw error
        }
        if (!session) throw new Error('You must be signed in to manage roles.')

      } catch (error) {
        setError(error);
        throw new Error(`Encountered error: ${error}`)
      }
    };

    getSupabaseClient();
  }, []);

  return { supabase, error };
}