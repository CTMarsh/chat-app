'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'
import { isValidUUID } from '@/lib/utils/validation'
import { getPlatformSettingValue } from '@/lib/actions/platform-settings'
import type { Workspace, WorkspaceWithMembers, Widget, WorkspaceRole } from '@/lib/types/database'

export async function getWorkspaces(): Promise<{ data: WorkspaceWithMembers[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Get workspaces where user is owner or member
  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from('workspaces')
    .select(`
      *,
      members:workspace_members(
        *,
        profile:profiles(*)
      ),
      widgets(*)
    `)
    .eq('owner_id', user.id)

  const { data: memberWorkspaceIds, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  if (ownedError || memberError) {
    return { data: null, error: 'Failed to fetch workspaces' }
  }

  // Combine and deduplicate
  const workspaceMap = new Map<string, WorkspaceWithMembers>()

  ownedWorkspaces?.forEach(w => {
    workspaceMap.set(w.id, w as WorkspaceWithMembers)
  })

  // Fetch full workspace data for memberships
  if (memberWorkspaceIds && memberWorkspaceIds.length > 0) {
    const memberWsIds = memberWorkspaceIds.map(m => m.workspace_id).filter(id => !workspaceMap.has(id))

    if (memberWsIds.length > 0) {
      const { data: memberWorkspacesData } = await supabase
        .from('workspaces')
        .select(`
          *,
          members:workspace_members(
            *,
            profile:profiles(*)
          ),
          widgets(*)
        `)
        .in('id', memberWsIds)

      memberWorkspacesData?.forEach(w => {
        workspaceMap.set(w.id, w as WorkspaceWithMembers)
      })
    }
  }

  return { data: Array.from(workspaceMap.values()), error: null }
}

export async function getWorkspace(workspaceId: string): Promise<{ data: WorkspaceWithMembers | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify user is owner or member before returning data
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { data: null, error: 'Workspace not found' }
  }

  const isOwner = workspace.owner_id === user.id

  if (!isOwner) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return { data: null, error: 'Not authorized' }
    }
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      members:workspace_members(
        *,
        profile:profiles(*)
      ),
      widgets(*)
    `)
    .eq('id', workspaceId)
    .single()

  if (error) {
    return { data: null, error: 'Workspace not found' }
  }

  return { data: data as WorkspaceWithMembers, error: null }
}

export async function createWorkspace(name: string): Promise<{ data: Workspace | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify MFA
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { data: null, error: 'MFA verification required' }
  }

  // Enforce max_workspaces_per_user
  const { data: maxSetting } = await getPlatformSettingValue('max_workspaces_per_user')
  if (maxSetting) {
    const maxWorkspaces = parseInt(maxSetting, 10)
    if (!isNaN(maxWorkspaces)) {
      const { count } = await supabase
        .from('workspaces')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      if ((count ?? 0) >= maxWorkspaces) {
        return { data: null, error: `Workspace limit reached (max ${maxWorkspaces})` }
      }
    }
  }

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  return { data, error: null }
}

export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; include_owners_in_availability?: boolean }
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

  const { error } = await supabase
    .from('workspaces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  return { error: null }
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error: string | null }> {
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

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  return { error: null }
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole = 'agent'
): Promise<{ error: string | null }> {
  if (!isValidUUID(userId)) {
    return { error: 'Invalid user ID' }
  }

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

  // Verify caller is workspace owner or admin
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { error: 'Workspace not found' }
  }

  if (workspace.owner_id !== user.id) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { error: 'Only workspace owners and admins can add members' }
    }
  }

  // Enforce max_workspace_members
  const { data: maxSetting } = await getPlatformSettingValue('max_workspace_members')
  if (maxSetting) {
    const maxMembers = parseInt(maxSetting, 10)
    if (!isNaN(maxMembers)) {
      const { count } = await supabase
        .from('workspace_members')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      if ((count ?? 0) >= maxMembers) {
        return { error: `Member limit reached (max ${maxMembers})` }
      }
    }
  }

  const { error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    })

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  return { error: null }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isValidUUID(userId)) {
    return { error: 'Invalid user ID' }
  }

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

  // Verify caller is workspace owner or admin
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { error: 'Workspace not found' }
  }

  if (workspace.owner_id !== user.id) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { error: 'Only workspace owners and admins can remove members' }
    }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  return { error: null }
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
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

  // Check that the current user is the workspace owner or an admin
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsError || !workspace) {
    return { error: 'Workspace not found' }
  }

  const isOwner = workspace.owner_id === user.id

  if (!isOwner) {
    // Check if current user is an admin
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { error: 'Only workspace owners and admins can change member roles' }
    }
  }

  // Cannot change role of the workspace owner (they don't have a member entry with role)
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!targetMember) {
    return { error: 'Member not found' }
  }

  if (targetMember.user_id === workspace.owner_id) {
    return { error: 'Cannot change role of workspace owner' }
  }

  // Only workspace owners can promote to admin
  if (newRole === 'admin' && !isOwner) {
    return { error: 'Only workspace owners can promote members to admin' }
  }

  // Update the member's role
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/workspaces')
  revalidatePath(`/chat/settings/workspaces/${workspaceId}`)
  return { error: null }
}
