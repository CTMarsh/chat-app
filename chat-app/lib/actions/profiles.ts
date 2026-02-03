'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

export async function searchProfiles(query?: string): Promise<{ data: Profile[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Build query
  let dbQuery = supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id) // Exclude current user
    .limit(20)

  // If search query provided, filter by username or display_name
  if (query && query.trim()) {
    dbQuery = dbQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
  }

  // Order by display_name for consistent results
  dbQuery = dbQuery.order('display_name', { ascending: true, nullsFirst: false })

  const { data, error } = await dbQuery

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getProfile(userId: string): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
