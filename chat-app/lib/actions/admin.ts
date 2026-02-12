'use server'

import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'
import { isValidUUID } from '@/lib/utils/validation'
import { sanitizePostgRESTFilter } from '@/lib/utils/postgrest-sanitizer'
import { getPlatformSettingValue } from '@/lib/actions/platform-settings'

// ============================================================
// Auth helper — every admin action calls this first
// ============================================================

async function requirePlatformAdmin() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { supabase: null, user: null, error: 'Not authenticated' }
  }

  // Verify MFA
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { supabase: null, user: null, error: 'MFA verification required' }
  }

  // Check platform admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) {
    return { supabase: null, user: null, error: 'Access denied' }
  }

  return { supabase, user, error: null }
}

// ============================================================
// Dashboard
// ============================================================

export async function getAdminDashboardMetrics(): Promise<{
  data: {
    total_users: number
    total_workspaces: number
    total_conversations: number
    total_messages: number
    total_widgets: number
    active_today: number
    conversations_today: number
    messages_today: number
  } | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data, error: rpcError } = await supabase.rpc('admin_get_dashboard_metrics')

  if (rpcError) {
    return { data: null, error: sanitizeErrorMessage(rpcError.message) }
  }

  return { data: data as {
    total_users: number
    total_workspaces: number
    total_conversations: number
    total_messages: number
    total_widgets: number
    active_today: number
    conversations_today: number
    messages_today: number
  }, error: null }
}

// ============================================================
// Workspaces
// ============================================================

export async function getAdminWorkspaces(search?: string): Promise<{
  data: Array<{
    id: string
    name: string
    owner_id: string
    created_at: string | null
    member_count: number
    widget_count: number
    owner: { username: string; display_name: string | null; email: string | null } | null
  }> | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  let query = supabase
    .from('workspaces')
    .select(`
      id, name, owner_id, created_at,
      members:workspace_members(count),
      widgets(count),
      owner:profiles!workspaces_owner_id_fkey(username, display_name, email)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    const sanitized = sanitizePostgRESTFilter(search)
    query = query.ilike('name', `%${sanitized}%`)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return { data: null, error: sanitizeErrorMessage(queryError.message) }
  }

  const workspaces = (data || []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    name: w.name as string,
    owner_id: w.owner_id as string,
    created_at: w.created_at as string | null,
    member_count: ((w.members as Array<{ count: number }>)?.[0]?.count) || 0,
    widget_count: ((w.widgets as Array<{ count: number }>)?.[0]?.count) || 0,
    owner: (Array.isArray(w.owner) ? w.owner[0] : w.owner) as { username: string; display_name: string | null; email: string | null } | null,
  }))

  return { data: workspaces, error: null }
}

export async function getAdminWorkspace(id: string): Promise<{
  data: {
    id: string
    name: string
    owner_id: string
    created_at: string | null
    updated_at: string | null
    include_owners_in_availability: boolean
    owner: { id: string; username: string; display_name: string | null; email: string | null } | null
    members: Array<{
      id: string
      user_id: string
      role: string
      created_at: string | null
      profile: { id: string; username: string; display_name: string | null; email: string | null; avatar_url: string | null }
    }>
    widgets: Array<{
      id: string
      name: string
      is_active: boolean | null
      created_at: string | null
    }>
    conversation_count: number
  } | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select(`
      id, name, owner_id, created_at, updated_at, include_owners_in_availability,
      owner:profiles!workspaces_owner_id_fkey(id, username, display_name, email),
      members:workspace_members(
        id, user_id, role, created_at,
        profile:profiles(id, username, display_name, email, avatar_url)
      ),
      widgets(id, name, is_active, created_at)
    `)
    .eq('id', id)
    .single()

  if (wsError || !workspace) {
    return { data: null, error: 'Workspace not found' }
  }

  // Get conversation count for widgets in this workspace
  const widgetIds = ((workspace as Record<string, unknown>).widgets as Array<{ id: string }>)?.map(w => w.id) || []
  let conversationCount = 0
  if (widgetIds.length > 0) {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .in('widget_id', widgetIds)

    conversationCount = count || 0
  }

  const ws = workspace as Record<string, unknown>
  const ownerRaw = ws.owner
  const owner = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw

  // Members: flatten profile joins
  const members = ((ws.members || []) as Array<Record<string, unknown>>).map(m => ({
    id: m.id as string,
    user_id: m.user_id as string,
    role: m.role as string,
    created_at: m.created_at as string | null,
    profile: (Array.isArray(m.profile) ? m.profile[0] : m.profile) as {
      id: string; username: string; display_name: string | null; email: string | null; avatar_url: string | null
    },
  }))

  return {
    data: {
      id: ws.id as string,
      name: ws.name as string,
      owner_id: ws.owner_id as string,
      created_at: ws.created_at as string | null,
      updated_at: ws.updated_at as string | null,
      include_owners_in_availability: ws.include_owners_in_availability as boolean,
      owner: owner as { id: string; username: string; display_name: string | null; email: string | null } | null,
      members,
      widgets: (ws.widgets || []) as Array<{ id: string; name: string; is_active: boolean | null; created_at: string | null }>,
      conversation_count: conversationCount,
    },
    error: null,
  }
}

export async function suspendWorkspace(
  workspaceId: string,
  suspended: boolean
): Promise<{ error: string | null }> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { error: error || 'Access denied' }

  const { error: rpcError } = await supabase.rpc('admin_set_workspace_suspended', {
    p_workspace_id: workspaceId,
    p_suspended: suspended,
  })

  if (rpcError) {
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath('/admin/workspaces')
  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

// ============================================================
// Users
// ============================================================

export async function getAdminUsers(search?: string): Promise<{
  data: Array<{
    id: string
    username: string
    display_name: string | null
    email: string | null
    avatar_url: string | null
    status: string | null
    is_platform_admin: boolean
    created_at: string | null
    last_seen_at: string | null
    workspace_count: number
  }> | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  let query = supabase
    .from('profiles')
    .select(`
      id, username, display_name, email, avatar_url, status, is_platform_admin, created_at, last_seen_at,
      workspace_memberships:workspace_members(count)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    const sanitized = sanitizePostgRESTFilter(search)
    query = query.or(`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return { data: null, error: sanitizeErrorMessage(queryError.message) }
  }

  const users = (data || []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    username: u.username as string,
    display_name: u.display_name as string | null,
    email: u.email as string | null,
    avatar_url: u.avatar_url as string | null,
    status: u.status as string | null,
    is_platform_admin: (u.is_platform_admin as boolean) || false,
    created_at: u.created_at as string | null,
    last_seen_at: u.last_seen_at as string | null,
    workspace_count: ((u.workspace_memberships as Array<{ count: number }>)?.[0]?.count) || 0,
  }))

  return { data: users, error: null }
}

export async function adminCreateUser(params: {
  email: string
  name?: string
  sendConfirmationEmail: boolean
}): Promise<{ data: { id: string; generatedPassword: string } | null; error: string | null }> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  // Generate secure random password: 16 chars with mixed case, digits, symbols
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const bytes = randomBytes(16)
  const generatedPassword = Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join('')

  // Derive username from email prefix (same as signup flow)
  const username = params.email.split('@')[0]

  // Use service role client for admin.createUser
  const serviceClient = createServiceRoleClient()
  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email: params.email,
    password: generatedPassword,
    email_confirm: !params.sendConfirmationEmail,
    user_metadata: {
      full_name: params.name || null,
      username,
    },
  })

  if (createError) {
    return { data: null, error: sanitizeErrorMessage(createError.message) }
  }

  // Log action (do NOT log the password)
  await supabase.rpc('admin_log_action', {
    p_action: 'user_created',
    p_target_type: 'user',
    p_target_id: newUser.user.id,
    p_metadata: {
      email: params.email,
      name: params.name || null,
      email_confirmed: !params.sendConfirmationEmail,
    },
  })

  revalidatePath('/admin/users')
  return { data: { id: newUser.user.id, generatedPassword }, error: null }
}

export async function getAdminUser(id: string): Promise<{
  data: {
    id: string
    username: string
    display_name: string | null
    email: string | null
    avatar_url: string | null
    status: string | null
    is_platform_admin: boolean
    created_at: string | null
    last_seen_at: string | null
    workspaces: Array<{
      workspace_id: string
      role: string
      workspace: { id: string; name: string; owner_id: string }
    }>
    owned_workspaces: Array<{ id: string; name: string }>
  } | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id, username, display_name, email, avatar_url, status, is_platform_admin, created_at, last_seen_at
    `)
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    return { data: null, error: 'User not found' }
  }

  // Get workspace memberships
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id, role,
      workspace:workspaces(id, name, owner_id)
    `)
    .eq('user_id', id)

  // Get owned workspaces
  const { data: owned } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('owner_id', id)

  // Map memberships to flatten the workspace join (Supabase returns array for joins)
  const mappedMemberships = (memberships || []).map((m: Record<string, unknown>) => ({
    workspace_id: m.workspace_id as string,
    role: m.role as string,
    workspace: Array.isArray(m.workspace) ? m.workspace[0] : m.workspace,
  })) as Array<{
    workspace_id: string
    role: string
    workspace: { id: string; name: string; owner_id: string }
  }>

  return {
    data: {
      id: (profile as Record<string, unknown>).id as string,
      username: (profile as Record<string, unknown>).username as string,
      display_name: (profile as Record<string, unknown>).display_name as string | null,
      email: (profile as Record<string, unknown>).email as string | null,
      avatar_url: (profile as Record<string, unknown>).avatar_url as string | null,
      status: (profile as Record<string, unknown>).status as string | null,
      is_platform_admin: ((profile as Record<string, unknown>).is_platform_admin as boolean) || false,
      created_at: (profile as Record<string, unknown>).created_at as string | null,
      last_seen_at: (profile as Record<string, unknown>).last_seen_at as string | null,
      workspaces: mappedMemberships,
      owned_workspaces: (owned || []) as Array<{ id: string; name: string }>,
    },
    error: null,
  }
}

export async function suspendUser(
  userId: string,
  suspended: boolean
): Promise<{ error: string | null }> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { error: error || 'Access denied' }

  const { error: rpcError } = await supabase.rpc('admin_set_user_suspended', {
    p_user_id: userId,
    p_suspended: suspended,
  })

  if (rpcError) {
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { error: null }
}

export async function setUserAdmin(
  userId: string,
  isAdmin: boolean
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  // Prevent self-revocation of admin status
  if (userId === user.id && !isAdmin) {
    return { error: 'Cannot revoke your own admin status' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_platform_admin: isAdmin })
    .eq('id', userId)

  if (updateError) {
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  // Log action
  await supabase.rpc('admin_log_action', {
    p_action: isAdmin ? 'admin_granted' : 'admin_revoked',
    p_target_type: 'user',
    p_target_id: userId,
    p_metadata: { is_admin: isAdmin },
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { error: null }
}

export async function adminDeleteUser(
  userId: string
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  // Prevent self-deletion
  if (userId === user.id) {
    return { error: 'Cannot delete your own account' }
  }

  // Log before deletion (the user will be gone after)
  await supabase.rpc('admin_log_action', {
    p_action: 'user_deleted',
    p_target_type: 'user',
    p_target_id: userId,
    p_metadata: {},
  })

  const { error: rpcError } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId,
  })

  if (rpcError) {
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath('/admin/users')
  return { error: null }
}

export async function adminResetUserMFA(
  userId: string
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: rpcError } = await supabase.rpc('admin_reset_user_mfa', {
    p_user_id: userId,
  })

  if (rpcError) {
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'user_mfa_reset',
    p_target_type: 'user',
    p_target_id: userId,
    p_metadata: {},
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { error: null }
}

// ============================================================
// Audit Log
// ============================================================

export async function getAuditLogs(filters?: {
  action?: string
  adminId?: string
  startDate?: string
  endDate?: string
}): Promise<{
  data: Array<{
    id: string
    admin_id: string
    action: string
    target_type: string
    target_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    admin: { username: string; display_name: string | null } | null
  }> | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  let query = supabase
    .from('admin_audit_logs')
    .select(`
      id, admin_id, action, target_type, target_id, metadata, created_at,
      admin:profiles!admin_audit_logs_admin_id_fkey(username, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters?.action) {
    query = query.eq('action', filters.action)
  }
  if (filters?.adminId) {
    query = query.eq('admin_id', filters.adminId)
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return { data: null, error: sanitizeErrorMessage(queryError.message) }
  }

  // Map to flatten admin join (Supabase returns array for joins)
  const logs = (data || []).map((log: Record<string, unknown>) => ({
    id: log.id as string,
    admin_id: log.admin_id as string,
    action: log.action as string,
    target_type: log.target_type as string,
    target_id: log.target_id as string | null,
    metadata: (log.metadata || {}) as Record<string, unknown>,
    created_at: log.created_at as string,
    admin: Array.isArray(log.admin)
      ? (log.admin[0] as { username: string; display_name: string | null } | undefined) ?? null
      : log.admin as { username: string; display_name: string | null } | null,
  }))

  return { data: logs, error: null }
}

// ============================================================
// Platform Settings
// ============================================================

export async function getPlatformSettings(): Promise<{
  data: Array<{
    key: string
    value: string
    description: string | null
    updated_at: string
  }> | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data, error: queryError } = await supabase
    .from('platform_settings')
    .select('key, value, description, updated_at')
    .order('key')

  if (queryError) {
    return { data: null, error: sanitizeErrorMessage(queryError.message) }
  }

  return { data: data as Array<{ key: string; value: string; description: string | null; updated_at: string }>, error: null }
}

const ALLOWED_PLATFORM_SETTING_KEYS = [
  'max_workspaces_per_user',
  'max_workspace_members',
  'max_widgets_per_workspace',
  'allow_signups',
] as const

export async function updatePlatformSetting(
  key: string,
  value: string
): Promise<{ error: string | null }> {
  if (!ALLOWED_PLATFORM_SETTING_KEYS.includes(key as typeof ALLOWED_PLATFORM_SETTING_KEYS[number])) {
    return { error: 'Invalid setting key' }
  }

  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { error: error || 'Access denied' }

  const { error: rpcError } = await supabase.rpc('admin_update_setting', {
    p_key: key,
    p_value: value,
  })

  if (rpcError) {
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath('/admin/settings')
  return { error: null }
}

// ============================================================
// Workspace CRUD
// ============================================================

export async function adminCreateWorkspace(
  name: string,
  ownerId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { data: null, error: error || 'Access denied' }

  // Enforce max_workspaces_per_user
  const { data: maxSetting } = await getPlatformSettingValue('max_workspaces_per_user')
  if (maxSetting) {
    const maxWorkspaces = parseInt(maxSetting, 10)
    if (!isNaN(maxWorkspaces)) {
      const { count } = await supabase
        .from('workspaces')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId)

      if ((count ?? 0) >= maxWorkspaces) {
        return { data: null, error: `Workspace limit reached for this user (max ${maxWorkspaces})` }
      }
    }
  }

  const { data, error: insertError } = await supabase
    .from('workspaces')
    .insert({ name, owner_id: ownerId })
    .select('id')
    .single()

  if (insertError) {
    return { data: null, error: sanitizeErrorMessage(insertError.message) }
  }

  // Log action
  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_created',
    p_target_type: 'workspace',
    p_target_id: data.id,
    p_metadata: { name, owner_id: ownerId },
  })

  revalidatePath('/admin/workspaces')
  return { data: { id: data.id }, error: null }
}

export async function adminUpdateWorkspace(
  workspaceId: string,
  updates: { name?: string; include_owners_in_availability?: boolean }
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.include_owners_in_availability !== undefined) dbUpdates.include_owners_in_availability = updates.include_owners_in_availability

  const { error: updateError } = await supabase
    .from('workspaces')
    .update(dbUpdates)
    .eq('id', workspaceId)

  if (updateError) {
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_updated',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: updates,
  })

  revalidatePath('/admin/workspaces')
  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

export async function adminGetWorkspaceSettings(
  workspaceId: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data, error: fetchError } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchError) {
    return { data: null, error: sanitizeErrorMessage(fetchError.message) }
  }

  return { data, error: null }
}

export async function adminUpdateWorkspaceSettings(
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
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: updateError } = await supabase
    .from('workspace_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)

  if (updateError) {
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_settings_updated',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: updates,
  })

  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

export async function adminDeleteWorkspace(
  workspaceId: string
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: deleteError } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (deleteError) {
    return { error: sanitizeErrorMessage(deleteError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_deleted',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: {},
  })

  revalidatePath('/admin/workspaces')
  return { error: null }
}

// ============================================================
// Workspace Member Management
// ============================================================

export async function adminAddWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: string
): Promise<{ error: string | null }> {
  if (!isValidUUID(userId)) {
    return { error: 'Invalid user ID' }
  }

  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  // Enforce max_workspace_members
  const { data: maxMemberSetting } = await getPlatformSettingValue('max_workspace_members')
  if (maxMemberSetting) {
    const maxMembers = parseInt(maxMemberSetting, 10)
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

  const { error: insertError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role })

  if (insertError) {
    return { error: sanitizeErrorMessage(insertError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_member_added',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: { user_id: userId, role },
  })

  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

export async function adminRemoveWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<{ error: string | null }> {
  if (!isValidUUID(memberId)) {
    return { error: 'Invalid member ID' }
  }

  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: deleteError } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    return { error: sanitizeErrorMessage(deleteError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_member_removed',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: { member_id: memberId },
  })

  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

export async function adminUpdateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: string
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: updateError } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'workspace_member_role_changed',
    p_target_type: 'workspace',
    p_target_id: workspaceId,
    p_metadata: { member_id: memberId, new_role: newRole },
  })

  revalidatePath(`/admin/workspaces/${workspaceId}`)
  return { error: null }
}

// ============================================================
// Widget Management (Admin)
// ============================================================

export async function getAdminWidgets(search?: string, workspaceId?: string): Promise<{
  data: Array<{
    id: string
    name: string
    workspace_id: string
    is_active: boolean | null
    created_at: string | null
    workspace_name: string
    conversation_count: number
  }> | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  let query = supabase
    .from('widgets')
    .select(`
      id, name, workspace_id, is_active, created_at,
      workspace:workspaces(name),
      conversations(count)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return { data: null, error: sanitizeErrorMessage(queryError.message) }
  }

  const widgets = (data || []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    name: w.name as string,
    workspace_id: w.workspace_id as string,
    is_active: w.is_active as boolean | null,
    created_at: w.created_at as string | null,
    workspace_name: ((Array.isArray(w.workspace) ? w.workspace[0] : w.workspace) as { name: string } | null)?.name || 'Unknown',
    conversation_count: ((w.conversations as Array<{ count: number }>)?.[0]?.count) || 0,
  }))

  return { data: widgets, error: null }
}

export async function getAdminWidget(id: string): Promise<{
  data: {
    id: string
    name: string
    workspace_id: string
    embed_token: string | null
    primary_color: string | null
    position: string | null
    welcome_message: string | null
    offline_message: string | null
    require_email: boolean | null
    collect_name: boolean | null
    is_active: boolean | null
    allowed_origins: string[] | null
    created_at: string | null
    updated_at: string | null
    workspace_name: string
    conversation_count: number
  } | null
  error: string | null
}> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data: widget, error: queryError } = await supabase
    .from('widgets')
    .select(`
      *,
      workspace:workspaces(name)
    `)
    .eq('id', id)
    .single()

  if (queryError || !widget) {
    return { data: null, error: 'Widget not found' }
  }

  // Get conversation count
  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('widget_id', id)

  const w = widget as Record<string, unknown>
  const ws = (Array.isArray(w.workspace) ? w.workspace[0] : w.workspace) as { name: string } | null

  return {
    data: {
      id: w.id as string,
      name: w.name as string,
      workspace_id: w.workspace_id as string,
      embed_token: w.embed_token as string | null,
      primary_color: w.primary_color as string | null,
      position: w.position as string | null,
      welcome_message: w.welcome_message as string | null,
      offline_message: w.offline_message as string | null,
      require_email: w.require_email as boolean | null,
      collect_name: w.collect_name as boolean | null,
      is_active: w.is_active as boolean | null,
      allowed_origins: w.allowed_origins as string[] | null,
      created_at: w.created_at as string | null,
      updated_at: w.updated_at as string | null,
      workspace_name: ws?.name || 'Unknown',
      conversation_count: count || 0,
    },
    error: null,
  }
}

export async function adminCreateWidget(
  workspaceId: string,
  name: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { data: null, error: error || 'Access denied' }

  // Enforce max_widgets_per_workspace
  const { data: maxWidgetSetting } = await getPlatformSettingValue('max_widgets_per_workspace')
  if (maxWidgetSetting) {
    const maxWidgets = parseInt(maxWidgetSetting, 10)
    if (!isNaN(maxWidgets)) {
      const { count } = await supabase
        .from('widgets')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      if ((count ?? 0) >= maxWidgets) {
        return { data: null, error: `Widget limit reached (max ${maxWidgets})` }
      }
    }
  }

  const { data, error: insertError } = await supabase
    .from('widgets')
    .insert({ workspace_id: workspaceId, name: name || 'Default Widget' })
    .select('id')
    .single()

  if (insertError) {
    return { data: null, error: sanitizeErrorMessage(insertError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'widget_created',
    p_target_type: 'widget',
    p_target_id: data.id,
    p_metadata: { workspace_id: workspaceId, name },
  })

  revalidatePath('/admin/widgets')
  return { data: { id: data.id }, error: null }
}

export async function adminUpdateWidget(
  widgetId: string,
  updates: {
    name?: string
    primaryColor?: string
    position?: string
    welcomeMessage?: string
    offlineMessage?: string
    requireEmail?: boolean
    collectName?: boolean
    isActive?: boolean
    allowedOrigins?: string[]
  }
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor
  if (updates.position !== undefined) dbUpdates.position = updates.position
  if (updates.welcomeMessage !== undefined) dbUpdates.welcome_message = updates.welcomeMessage
  if (updates.offlineMessage !== undefined) dbUpdates.offline_message = updates.offlineMessage
  if (updates.requireEmail !== undefined) dbUpdates.require_email = updates.requireEmail
  if (updates.collectName !== undefined) dbUpdates.collect_name = updates.collectName
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  if (updates.allowedOrigins !== undefined) dbUpdates.allowed_origins = updates.allowedOrigins

  const { error: updateError } = await supabase
    .from('widgets')
    .update(dbUpdates)
    .eq('id', widgetId)

  if (updateError) {
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'widget_updated',
    p_target_type: 'widget',
    p_target_id: widgetId,
    p_metadata: updates,
  })

  revalidatePath('/admin/widgets')
  revalidatePath(`/admin/widgets/${widgetId}`)
  return { error: null }
}

export async function adminDeleteWidget(
  widgetId: string
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requirePlatformAdmin()
  if (error || !supabase || !user) return { error: error || 'Access denied' }

  const { error: deleteError } = await supabase
    .from('widgets')
    .delete()
    .eq('id', widgetId)

  if (deleteError) {
    return { error: sanitizeErrorMessage(deleteError.message) }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'widget_deleted',
    p_target_type: 'widget',
    p_target_id: widgetId,
    p_metadata: {},
  })

  revalidatePath('/admin/widgets')
  return { error: null }
}

export async function adminRegenerateWidgetToken(
  widgetId: string
): Promise<{ data: { embedToken: string } | null; error: string | null }> {
  const { supabase, error } = await requirePlatformAdmin()
  if (error || !supabase) return { data: null, error: error || 'Access denied' }

  const { data, error: rpcError } = await supabase.rpc('admin_regenerate_widget_token', {
    p_widget_id: widgetId,
  })

  if (rpcError) {
    return { data: null, error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath(`/admin/widgets/${widgetId}`)
  revalidatePath('/admin/widgets')
  return { data: { embedToken: data }, error: null }
}

// ============================================================
// Admin check for client-side use (sidebar link visibility)
// ============================================================

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_platform_admin === true
}
