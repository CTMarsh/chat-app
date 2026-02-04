'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

export interface SearchProfilesOptions {
  query?: string
  limit?: number
  offset?: number
  excludeUserIds?: string[]
}

export interface SearchProfilesResult {
  data: Profile[] | null
  error: string | null
  hasMore: boolean
  total?: number
}

export async function searchProfiles(options: SearchProfilesOptions = {}): Promise<SearchProfilesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated', hasMore: false }
  }

  const {
    query,
    limit = 20,
    offset = 0,
    excludeUserIds = []
  } = options

  // Build base query with count
  let dbQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .neq('id', user.id) // Always exclude current user

  // Exclude additional user IDs if provided
  if (excludeUserIds.length > 0) {
    dbQuery = dbQuery.not('id', 'in', `(${excludeUserIds.join(',')})`)
  }

  // If search query provided, filter by username or display_name
  if (query && query.trim()) {
    dbQuery = dbQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
  }

  // Order by display_name for consistent results
  dbQuery = dbQuery
    .order('display_name', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await dbQuery

  if (error) {
    return { data: null, error: error.message, hasMore: false }
  }

  const hasMore = count !== null ? offset + (data?.length || 0) < count : false

  return { data, error: null, hasMore, total: count || undefined }
}

// Legacy overload for backward compatibility
export async function searchProfilesLegacy(query?: string): Promise<{ data: Profile[] | null; error: string | null }> {
  const result = await searchProfiles({ query })
  return { data: result.data, error: result.error }
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
