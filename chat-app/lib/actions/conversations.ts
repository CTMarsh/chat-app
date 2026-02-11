'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'

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

export async function createDirectConversation(otherUserId: string) {
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
