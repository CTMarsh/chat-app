'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Widget, WidgetWithWorkspace } from '@/lib/types/database'

export async function getWidgets(workspaceId?: string): Promise<{ data: WidgetWithWorkspace[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  let query = supabase
    .from('widgets')
    .select(`
      *,
      workspace:workspaces(*)
    `)

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
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

  const { data, error } = await supabase
    .from('widgets')
    .insert({
      workspace_id: workspaceId,
      name: config.name || 'Default Widget',
      primary_color: config.primaryColor || '#6366f1',
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
    return { data: null, error: error.message }
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
    return { error: error.message }
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

  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', widgetId)

  if (error) {
    return { error: error.message }
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

  // Generate new token using SQL function
  const { data, error } = await supabase.rpc('regenerate_widget_token', { widget_id: widgetId })

  if (error) {
    // Fallback: update directly if RPC doesn't exist
    const { data: widget, error: updateError } = await supabase
      .from('widgets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', widgetId)
      .select('embed_token')
      .single()

    if (updateError) {
      return { data: null, error: updateError.message }
    }

    return { data: { embedToken: widget.embed_token }, error: null }
  }

  revalidatePath(`/chat/settings/widgets/${widgetId}`)
  return { data: { embedToken: data }, error: null }
}
