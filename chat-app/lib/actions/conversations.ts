'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'
import { isValidUUID } from '@/lib/utils/validation'

export async function endConversation(conversationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  // Verify user is a participant in the conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return { error: 'Not authorized to end this conversation' }
  }

  // Verify this is a widget conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('type, ended_at')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    return { error: 'Conversation not found' }
  }

  if (conversation.type !== 'widget') {
    return { error: 'Only widget conversations can be ended' }
  }

  if (conversation.ended_at) {
    return { error: 'Conversation is already ended' }
  }

  // End the conversation
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (updateError) {
    console.error('Error ending conversation:', updateError)
    return { error: sanitizeErrorMessage(updateError.message) }
  }

  revalidatePath('/chat')
  return { error: null }
}

export async function updateGroupInfo(
  conversationId: string,
  updates: { name?: string; description?: string }
): Promise<{ error: string | null }> {
  if (!isValidUUID(conversationId)) {
    return { error: 'Invalid conversation ID' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') return { error: 'MFA verification required' }

  // Verify user is an admin participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) return { error: 'Not a member of this conversation' }

  // Also allow creator (check conversations.created_by)
  const { data: conv } = await supabase
    .from('conversations')
    .select('created_by, type')
    .eq('id', conversationId)
    .single()

  if (!conv || conv.type !== 'group') return { error: 'Not a group conversation' }

  const isAdmin = participant.role === 'admin' || conv.created_by === user.id
  if (!isAdmin) return { error: 'Only admins can edit group info' }

  // Validate inputs
  const updateFields: Record<string, string> = {}
  if (updates.name !== undefined) {
    const name = updates.name.trim()
    if (!name || name.length > 100) return { error: 'Group name must be 1-100 characters' }
    updateFields.name = name
  }
  if (updates.description !== undefined) {
    if (updates.description.length > 500) return { error: 'Description must be 500 characters or less' }
    updateFields.description = updates.description.trim()
  }

  if (Object.keys(updateFields).length === 0) return { error: null }

  const { error: updateError } = await supabase
    .from('conversations')
    .update(updateFields)
    .eq('id', conversationId)

  if (updateError) return { error: sanitizeErrorMessage(updateError.message) }

  revalidatePath('/chat')
  return { error: null }
}

export async function addGroupMember(
  conversationId: string,
  newUserId: string
): Promise<{ error: string | null }> {
  if (!isValidUUID(conversationId) || !isValidUUID(newUserId)) {
    return { error: 'Invalid ID' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') return { error: 'MFA verification required' }

  // Verify caller is admin
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  const { data: conv } = await supabase
    .from('conversations')
    .select('created_by, type')
    .eq('id', conversationId)
    .single()

  if (!conv || conv.type !== 'group') return { error: 'Not a group conversation' }
  if (!participant) return { error: 'Not a member of this conversation' }

  const isAdmin = participant.role === 'admin' || conv.created_by === user.id
  if (!isAdmin) return { error: 'Only admins can add members' }

  // Check if user already a member
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', newUserId)
    .maybeSingle()

  if (existing) return { error: 'User is already a member' }

  const { error: insertError } = await supabase
    .from('conversation_participants')
    .insert({ conversation_id: conversationId, user_id: newUserId, role: 'member' })

  if (insertError) return { error: sanitizeErrorMessage(insertError.message) }

  revalidatePath('/chat')
  return { error: null }
}

export async function removeGroupMember(
  conversationId: string,
  targetUserId: string
): Promise<{ error: string | null }> {
  if (!isValidUUID(conversationId) || !isValidUUID(targetUserId)) {
    return { error: 'Invalid ID' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') return { error: 'MFA verification required' }

  // Verify caller is admin
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  const { data: conv } = await supabase
    .from('conversations')
    .select('created_by, type')
    .eq('id', conversationId)
    .single()

  if (!conv || conv.type !== 'group') return { error: 'Not a group conversation' }
  if (!participant) return { error: 'Not a member of this conversation' }

  const isAdmin = participant.role === 'admin' || conv.created_by === user.id
  if (!isAdmin) return { error: 'Only admins can remove members' }

  // Cannot remove the creator
  if (targetUserId === conv.created_by) return { error: 'Cannot remove the group creator' }

  const { error: deleteError } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)

  if (deleteError) return { error: sanitizeErrorMessage(deleteError.message) }

  revalidatePath('/chat')
  return { error: null }
}

export async function updateMemberRole(
  conversationId: string,
  targetUserId: string,
  role: 'admin' | 'moderator' | 'member'
): Promise<{ error: string | null }> {
  if (!isValidUUID(conversationId) || !isValidUUID(targetUserId)) {
    return { error: 'Invalid ID' }
  }

  if (!['admin', 'moderator', 'member'].includes(role)) {
    return { error: 'Invalid role' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') return { error: 'MFA verification required' }

  // Verify caller is admin
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  const { data: conv } = await supabase
    .from('conversations')
    .select('created_by, type')
    .eq('id', conversationId)
    .single()

  if (!conv || conv.type !== 'group') return { error: 'Not a group conversation' }
  if (!participant) return { error: 'Not a member of this conversation' }

  const isAdmin = participant.role === 'admin' || conv.created_by === user.id
  if (!isAdmin) return { error: 'Only admins can change roles' }

  // Cannot change the creator's role
  if (targetUserId === conv.created_by) return { error: 'Cannot change the creator\'s role' }

  const { error: updateError } = await supabase
    .from('conversation_participants')
    .update({ role })
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)

  if (updateError) return { error: sanitizeErrorMessage(updateError.message) }

  revalidatePath('/chat')
  return { error: null }
}

export async function createDirectConversation(otherUserId: string) {
  if (!isValidUUID(otherUserId)) {
    return { error: 'Invalid user ID' }
  }

  const supabase = await createClient()

  // Get the authenticated user - server-side has access to cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Verify MFA status for security
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { error: 'MFA verification required' }
  }

  // Use RPC function to create conversation (handles RLS via SECURITY DEFINER)
  const { data: conversationId, error: rpcError } = await supabase
    .rpc('create_direct_conversation', { p_other_user_id: otherUserId })

  if (rpcError) {
    console.error('Error creating conversation:', rpcError)
    return { error: sanitizeErrorMessage(rpcError.message) }
  }

  revalidatePath('/chat')
  return { conversationId }
}
