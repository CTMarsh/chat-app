'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
  /** Optional ID to associate with the control - if not provided, one will be generated */
  htmlFor?: string
}

export function SettingRow({
  label,
  description,
  children,
  className,
  htmlFor,
}: SettingRowProps) {
  const generatedId = useId()
  const labelId = `${generatedId}-label`
  const descriptionId = description ? `${generatedId}-description` : undefined

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-8 py-3 border-b border-border/50 last:border-0 last:pb-0 first:pt-0',
        className
      )}
    >
      <div className="flex-1 space-y-1">
        <label
          id={labelId}
          htmlFor={htmlFor}
          className="text-sm font-medium cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div
        className="shrink-0"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      >
        {children}
      </div>
    </div>
  )
}
