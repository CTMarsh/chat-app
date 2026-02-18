'use client'

import { ExternalLink } from 'lucide-react'

interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

interface LinkPreviewProps {
  preview: LinkPreviewData
}

// Only allow https:// URLs to prevent javascript: or data: injection
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function LinkPreview({ preview }: LinkPreviewProps) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  // Reject unsafe URLs entirely
  if (!isSafeUrl(preview.url)) return null

  const safeImage = preview.image && isSafeUrl(preview.image) ? preview.image : null

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-lg border bg-muted/30 transition-colors hover:bg-muted/50"
      aria-label={preview.title ? `Link to ${preview.title} on ${preview.siteName || getDomain(preview.url)}` : `External link to ${getDomain(preview.url)}`}
    >
      {safeImage && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={safeImage}
            alt={preview.title ? `Preview image for ${preview.title}` : 'Link preview image'}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          <span>{preview.siteName || getDomain(preview.url)}</span>
        </div>
        {preview.title && (
          <h4 className="mt-1 line-clamp-1 text-sm font-medium">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}

// Helper to extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g
  return text.match(urlRegex) || []
}
