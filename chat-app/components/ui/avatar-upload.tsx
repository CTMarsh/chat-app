'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  fallback: string
  onUpload: (url: string | null) => void
}

export function AvatarUpload({ userId, currentUrl, fallback, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Delete old avatar if exists
      if (currentUrl) {
        const oldPath = currentUrl.split('/avatars/')[1]
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onUpload(publicUrl)
    } catch (err: unknown) {
      console.error('Avatar upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [userId, currentUrl, supabase, onUpload])

  const handleRemove = useCallback(async () => {
    if (!currentUrl) return

    setIsUploading(true)
    setError(null)

    try {
      // Delete from storage
      const path = currentUrl.split('/avatars/')[1]
      if (path) {
        await supabase.storage.from('avatars').remove([path])
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) throw updateError

      onUpload(null)
    } catch (err: unknown) {
      console.error('Avatar remove error:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }, [currentUrl, userId, supabase, onUpload])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUrl || undefined} alt="Your avatar" />
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label={currentUrl ? 'Change avatar' : 'Upload avatar'}
        >
          <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
          {currentUrl ? 'Change' : 'Upload'}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            aria-label="Remove avatar"
          >
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, GIF, or WebP. Max 5MB.
      </p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleUpload}
        className="hidden"
        aria-label="Select avatar image file"
      />
    </div>
  )
}
