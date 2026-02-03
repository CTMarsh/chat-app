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

/**
 * Get active sessions for the user
 */
export async function getActiveSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  // Note: Supabase doesn't expose session management directly
  // This would need to be implemented with custom session tracking
  // For now, return the current session info
  const { data: session } = await supabase.auth.getSession()

  return {
    data: session?.session ? [{
      id: 'current',
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      user_agent: 'Current browser',
      is_current: true,
    }] : [],
    error: null
  }
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
