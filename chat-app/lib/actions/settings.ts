'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserPreferences, BlockedUserWithProfile } from '@/lib/types/database'

// Partial update type for preferences
type PreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<{ data: UserPreferences | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no preferences exist, create default ones
    if (error.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (createError) {
        return { data: null, error: createError.message }
      }
      return { data: newPrefs as UserPreferences, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data: data as UserPreferences, error: null }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: PreferencesUpdate
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status for sensitive operations
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // If online_status_preference changed, also update profiles.status
  if ('online_status_preference' in updates && updates.online_status_preference) {
    const statusValue = updates.online_status_preference === 'invisible'
      ? 'offline'
      : updates.online_status_preference

    await supabase
      .from('profiles')
      .update({ status: statusValue })
      .eq('id', user.id)
  }

  // If show_online_status changed to false, set status to offline for privacy
  if ('show_online_status' in updates && updates.show_online_status === false) {
    await supabase
      .from('profiles')
      .update({ status: 'offline' })
      .eq('id', user.id)
  }

  revalidatePath('/settings')
  return { error: null }
}

/**
 * Block a user
 */
export async function blockUser(blockedUserId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  // Can't block yourself
  if (user.id === blockedUserId) {
    return { error: 'Cannot block yourself' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .insert({
      user_id: user.id,
      blocked_user_id: blockedUserId,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'User is already blocked' }
    }
    return { error: error.message }
  }

  revalidatePath('/settings/privacy')
  return { error: null }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockedUserId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('user_id', user.id)
    .eq('blocked_user_id', blockedUserId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/privacy')
  return { error: null }
}

/**
 * Get blocked users list
 */
export async function getBlockedUsers(): Promise<{ data: BlockedUserWithProfile[]; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select(`
      *,
      blocked_profile:profiles!blocked_users_blocked_user_id_fkey (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as BlockedUserWithProfile[], error: null }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('blocked_user_id', userId)
    .single()

  return !!data
}

/**
 * Update profile bio
 */
export async function updateProfileBio(bio: string): Promise<{ error: string | null }> {
  return updatePreferences({ bio })
}

export interface UserSession {
  id: string
  session_token: string
  user_agent: string | null
  ip_address: string | null
  last_active_at: string
  created_at: string
  expires_at: string
  is_current: boolean
}

/**
 * Get active sessions for the user
 */
export async function getActiveSessions(): Promise<{ data: UserSession[]; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  // Get current session token to identify which session is "current"
  const { data: authSession } = await supabase.auth.getSession()
  const currentToken = authSession?.session?.access_token

  // Fetch all sessions from the database
  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('last_active_at', { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  // Mark the current session
  const sessionsWithCurrent = (sessions || []).map(session => ({
    ...session,
    is_current: session.session_token === currentToken
  }))

  return { data: sessionsWithCurrent as UserSession[], error: null }
}

/**
 * Track/update the current session
 */
export async function trackSession(userAgent?: string, ipAddress?: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: authSession } = await supabase.auth.getSession()
  if (!authSession?.session?.access_token) {
    return { error: 'No active session' }
  }

  const { error } = await supabase.rpc('upsert_user_session', {
    p_user_id: user.id,
    p_session_token: authSession.session.access_token,
    p_user_agent: userAgent || null,
    p_ip_address: ipAddress || null
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  const { data, error } = await supabase.rpc('revoke_user_session', {
    p_session_id: sessionId
  })

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Session not found or already revoked' }
  }

  revalidatePath('/chat/settings/security')
  return { error: null }
}

/**
 * Revoke all sessions except the current one
 */
export async function revokeOtherSessions(): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { count: 0, error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { count: 0, error: 'MFA verification required' }
  }

  const { data: authSession } = await supabase.auth.getSession()
  if (!authSession?.session?.access_token) {
    return { count: 0, error: 'No active session' }
  }

  const { data, error } = await supabase.rpc('revoke_other_sessions', {
    p_current_session_token: authSession.session.access_token
  })

  if (error) {
    return { count: 0, error: error.message }
  }

  revalidatePath('/chat/settings/security')
  return { count: data || 0, error: null }
}

/**
 * Sign out from all devices
 */
export async function signOutAllDevices(): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
