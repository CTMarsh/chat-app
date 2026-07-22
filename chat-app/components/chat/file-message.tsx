'use client'

import { useState } from 'react'
import { File, Download, ExternalLink, Image as ImageIcon, FileText, FileSpreadsheet, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageLightbox } from './image-lightbox'

interface FileMessageProps {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export function FileMessage({ fileUrl, fileName, fileSize, fileType }: FileMessageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const isImage = fileType.startsWith('image/')

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-ark-blue" />
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-ark-crit" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-ark-blue" />
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-ark-good" />
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <Archive className="h-5 w-5 text-ark-warn" />
    return <File className="h-5 w-5 text-muted-foreground" />
  }

  if (isImage) {
    return (
      <>
        <div className="mt-2 max-w-sm overflow-hidden rounded-lg">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-h-64 w-auto cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-90"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
            aria-label={`View ${fileName} in full size`}
          />
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{fileName}</span>
            <span>({formatFileSize(fileSize)})</span>
          </div>
        </div>
        <ImageLightbox
          src={fileUrl}
          alt={fileName}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      {getFileIcon()}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
      </div>
      <div className="flex gap-1" role="group" aria-label="File actions">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
          aria-label={`Open ${fileName} in new tab`}
        >
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
          aria-label={`Download ${fileName}`}
        >
          <a href={fileUrl} download={fileName}>
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  )
}
