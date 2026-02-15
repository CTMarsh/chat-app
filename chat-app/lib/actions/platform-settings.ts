'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPlatformSettingValue(key: string): Promise<{ data: string | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    return { data: null, error: 'MFA verification required' }
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    return { data: null, error: 'Setting not found' }
  }

  return { data: data.value, error: null }
}

export async function checkSignupsAllowed(): Promise<{ allowed: boolean; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_allow_signups')

  if (error) {
    // Default to allowing signups if we can't check
    return { allowed: true, error: error.message }
  }

  return { allowed: data ?? true, error: null }
}
