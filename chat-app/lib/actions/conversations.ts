'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Check if conversation already exists
  const { data: existingParticipant } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations!inner(type)
    `)
    .eq('user_id', user.id)
    .eq('conversations.type', 'direct')

  if (existingParticipant) {
    // Check if the other user is also in any of these conversations
    for (const participant of existingParticipant) {
      const { data: otherParticipant } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', participant.conversation_id)
        .eq('user_id', otherUserId)
        .single()

      if (otherParticipant) {
        // Conversation already exists
        return { conversationId: participant.conversation_id }
      }
    }
  }

  // Debug: Log user ID being used for insert
  console.log('Creating conversation with created_by:', user.id)

  // Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: user.id,
    })
    .select()
    .single()

  if (convError) {
    console.error('Error creating conversation:', convError)
    console.error('User ID was:', user.id)
    console.error('User email was:', user.email)
    return { error: convError.message }
  }

  // Add participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: user.id, role: 'member' },
      { conversation_id: conversation.id, user_id: otherUserId, role: 'member' },
    ])

  if (partError) {
    console.error('Error adding participants:', partError)
    // Clean up the conversation if participants failed
    await supabase.from('conversations').delete().eq('id', conversation.id)
    return { error: partError.message }
  }

  revalidatePath('/chat')
  return { conversationId: conversation.id }
}
