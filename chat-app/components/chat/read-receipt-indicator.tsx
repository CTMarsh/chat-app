'use client'

import { Check, CheckCheck } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ReadReceiptIndicatorProps {
  isRead: boolean
  readBy?: string[]
}

export function ReadReceiptIndicator({ isRead, readBy = [] }: ReadReceiptIndicatorProps) {
  if (readBy.length === 0 && !isRead) {
    return (
      <Check className="h-3.5 w-3.5 text-muted-foreground" />
    )
  }

  if (readBy.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCheck className="h-3.5 w-3.5 text-primary" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Read by {readBy.length === 1 ? readBy[0] : `${readBy.length} people`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
  )
}
