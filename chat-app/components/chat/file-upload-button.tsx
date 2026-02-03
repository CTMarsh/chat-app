'use client'

import { useRef, useState, useCallback } from 'react'
import { Paperclip, X, File, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  selectedFile: File | null
  onClear: () => void
}

export function FileUploadButton({ onFileSelect, isUploading, selectedFile, onClear }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert('File must be less than 50MB')
        return
      }
      onFileSelect(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileSelect])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = selectedFile?.type.startsWith('image/')

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || !!selectedFile}
        style={{ width: '48px', height: '48px' }}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <Paperclip className="h-6 w-6 text-muted-foreground" />
        )}
      </Button>

      {selectedFile && (
        <div className="absolute bottom-12 left-0 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
          {isImage ? (
            <ImageIcon className="h-5 w-5 text-blue-500" />
          ) : (
            <File className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="max-w-[200px]">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClear}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.zip,.rar"
      />
    </div>
  )
}
