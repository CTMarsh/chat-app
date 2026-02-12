'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'
import type { WorkspaceSettings } from '@/lib/types/database'

async function verifyWorkspaceAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (workspace?.owner_id === userId) return true

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  return !!membership
}

export async function getWorkspaceSettings(
  workspaceId: string
): Promise<{ data: WorkspaceSettings | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify workspace membership
  if (!await verifyWorkspaceAccess(supabase, user.id, workspaceId)) {
    return { data: null, error: 'Not authorized' }
  }

  const { data, error } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  if (error) {
    return { data: null, error: sanitizeErrorMessage(error.message) }
  }

  return { data, error: null }
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  updates: {
    default_primary_color?: string
    default_welcome_message?: string
    default_offline_message?: string
    business_hours_enabled?: boolean
    business_hours?: Record<string, { start: string; end: string; enabled: boolean }>
    timezone?: string
    auto_reply_enabled?: boolean
    auto_reply_message?: string
    max_conversations_per_agent?: number
    notify_on_new_conversation?: boolean
    notify_on_unassigned_timeout?: boolean
    unassigned_timeout_minutes?: number
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  // Verify workspace ownership or admin role
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { error: 'Workspace not found' }
  }

  const isOwner = workspace.owner_id === user.id

  if (!isOwner) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { error: 'Only workspace owners and admins can update settings' }
    }
  }

  const { error } = await supabase
    .from('workspace_settings')
    .update(updates)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath(`/chat/settings/workspaces/${workspaceId}`)
  return { error: null }
}
