'use client'

import { createClient } from '@/lib/supabase/client'

export interface ScanResult {
  isClean: boolean
  message: string
  threats?: string[]
  skipped?: boolean
}

export async function scanFile(file: File): Promise<ScanResult> {
  const supabase = createClient()

  try {
    // Get the session for authentication
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    // Create form data with the file
    const formData = new FormData()
    formData.append('file', file)

    // Call the scan-file Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan-file`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    )

    if (!response.ok && response.status !== 422) {
      const error = await response.json().catch(() => ({ error: 'Scan failed' }))
      throw new Error(error.error || 'Failed to scan file')
    }

    const result: ScanResult = await response.json()
    return result
  } catch (error) {
    console.error('File scan error:', error)
    throw error
  }
}

export function isScanningEnabled(): boolean {
  // You can add logic here to check if scanning should be enabled
  // For example, based on environment variables or feature flags
  return true
}
