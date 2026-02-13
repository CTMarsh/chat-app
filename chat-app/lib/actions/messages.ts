'use server'

import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils/validation'

const MAX_MESSAGE_LENGTH = 10000

export async function editMessage(
  messageId: string,
  newContent: string
): Promise<{ error: string | null }> {
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

  // Validate inputs
  if (!isValidUUID(messageId)) {
    return { error: 'Invalid message ID' }
  }

  const trimmed = newContent.trim()
  if (!trimmed) {
    return { error: 'Message content cannot be empty' }
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }
  }

  // Update message (RLS enforces sender_id = auth.uid())
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      content: trimmed,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (updateError) {
    return { error: 'Failed to edit message' }
  }

  return { error: null }
}
