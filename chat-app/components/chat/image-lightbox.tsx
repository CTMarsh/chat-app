'use client'

import { useEffect, useCallback } from 'react'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setScale(1)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${alt}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex gap-2" role="toolbar" aria-label="Image controls">
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomOut}
          className="bg-black/50 hover:bg-black/70"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5 text-white" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomIn}
          className="bg-black/50 hover:bg-black/70"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5 text-white" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          asChild
          className="bg-black/50 hover:bg-black/70"
          aria-label={`Download ${alt}`}
        >
          <a href={src} download>
            <Download className="h-5 w-5 text-white" aria-hidden="true" />
          </a>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70"
          aria-label="Close image preview"
        >
          <X className="h-5 w-5 text-white" aria-hidden="true" />
        </Button>
      </div>

      {/* Image */}
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto">
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})` }}
          className="max-h-[90vh] max-w-[90vw] object-contain transition-transform"
        />
      </div>

      {/* Filename */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-sm text-white">
        {alt}
      </div>
    </div>
  )
}
