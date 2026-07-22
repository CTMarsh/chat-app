'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'
import { getPlatformSettingValue } from '@/lib/actions/platform-settings'
import type { Widget, WidgetWithWorkspace } from '@/lib/types/database'

async function verifyWorkspaceAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check if user is workspace owner
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (workspace?.owner_id === userId) return true

  // Check if user is a workspace member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  return !!membership
}

export async function getWidgets(workspaceId: string): Promise<{ data: WidgetWithWorkspace[] | null; error: string | null }> {
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
    .from('widgets')
    .select(`
      *,
      workspace:workspaces(*)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: sanitizeErrorMessage(error.message) }
  }

  return { data: data as WidgetWithWorkspace[], error: null }
}

export async function getWidget(widgetId: string): Promise<{ data: WidgetWithWorkspace | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('widgets')
    .select(`
      *,
      workspace:workspaces(*)
    `)
    .eq('id', widgetId)
    .single()

  if (error) {
    return { data: null, error: 'Widget not found' }
  }

  // Verify workspace membership
  if (!await verifyWorkspaceAccess(supabase, user.id, data.workspace_id)) {
    return { data: null, error: 'Not authorized' }
  }

  return { data: data as WidgetWithWorkspace, error: null }
}

export async function createWidget(
  workspaceId: string,
  config: {
    name?: string
    primaryColor?: string
    position?: 'bottom-right' | 'bottom-left'
    welcomeMessage?: string
    offlineMessage?: string
    requireEmail?: boolean
    collectName?: boolean
    allowedOrigins?: string[]
  }
): Promise<{ data: Widget | null; error: string | null }> {
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

  // Verify workspace membership
  if (!await verifyWorkspaceAccess(supabase, user.id, workspaceId)) {
    return { data: null, error: 'Not authorized' }
  }

  // Enforce max_widgets_per_workspace
  const { data: maxSetting } = await getPlatformSettingValue('max_widgets_per_workspace')
  if (maxSetting) {
    const maxWidgets = parseInt(maxSetting, 10)
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

  const { data, error } = await supabase
    .from('widgets')
    .insert({
      workspace_id: workspaceId,
      name: config.name || 'Default Widget',
      primary_color: config.primaryColor || '#2f8fff',
      position: config.position || 'bottom-right',
      welcome_message: config.welcomeMessage || 'Hi! How can we help you today?',
      offline_message: config.offlineMessage || "We're currently offline. Leave a message and we'll get back to you!",
      require_email: config.requireEmail ?? true,
      collect_name: config.collectName ?? true,
      allowed_origins: config.allowedOrigins || [],
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/widgets')
  return { data, error: null }
}

export async function updateWidget(
  widgetId: string,
  updates: {
    name?: string
    primaryColor?: string
    position?: 'bottom-right' | 'bottom-left'
    welcomeMessage?: string
    offlineMessage?: string
    requireEmail?: boolean
    collectName?: boolean
    allowedOrigins?: string[]
    isActive?: boolean
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

  // Verify workspace membership via widget lookup
  const { data: widget } = await supabase
    .from('widgets')
    .select('workspace_id')
    .eq('id', widgetId)
    .single()

  if (!widget) {
    return { error: 'Widget not found' }
  }

  if (!await verifyWorkspaceAccess(supabase, user.id, widget.workspace_id)) {
    return { error: 'Not authorized' }
  }

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor
  if (updates.position !== undefined) dbUpdates.position = updates.position
  if (updates.welcomeMessage !== undefined) dbUpdates.welcome_message = updates.welcomeMessage
  if (updates.offlineMessage !== undefined) dbUpdates.offline_message = updates.offlineMessage
  if (updates.requireEmail !== undefined) dbUpdates.require_email = updates.requireEmail
  if (updates.collectName !== undefined) dbUpdates.collect_name = updates.collectName
  if (updates.allowedOrigins !== undefined) dbUpdates.allowed_origins = updates.allowedOrigins
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

  const { error } = await supabase
    .from('widgets')
    .update(dbUpdates)
    .eq('id', widgetId)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/widgets')
  revalidatePath(`/chat/settings/widgets/${widgetId}`)
  return { error: null }
}

export async function deleteWidget(widgetId: string): Promise<{ error: string | null }> {
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

  // Verify workspace membership via widget lookup
  const { data: widget } = await supabase
    .from('widgets')
    .select('workspace_id')
    .eq('id', widgetId)
    .single()

  if (!widget) {
    return { error: 'Widget not found' }
  }

  if (!await verifyWorkspaceAccess(supabase, user.id, widget.workspace_id)) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', widgetId)

  if (error) {
    return { error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath('/chat/settings/widgets')
  return { error: null }
}

export async function regenerateEmbedToken(widgetId: string): Promise<{ data: { embedToken: string } | null; error: string | null }> {
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

  // Verify workspace membership via widget lookup
  const { data: widget } = await supabase
    .from('widgets')
    .select('workspace_id')
    .eq('id', widgetId)
    .single()

  if (!widget) {
    return { data: null, error: 'Widget not found' }
  }

  if (!await verifyWorkspaceAccess(supabase, user.id, widget.workspace_id)) {
    return { data: null, error: 'Not authorized' }
  }

  // Generate new token using SQL function
  const { data, error } = await supabase.rpc('regenerate_widget_token', { p_widget_id: widgetId })

  if (error) {
    return { data: null, error: sanitizeErrorMessage(error.message) }
  }

  revalidatePath(`/chat/settings/widgets/${widgetId}`)
  revalidatePath('/chat/settings/widgets')
  return { data: { embedToken: data }, error: null }
}
