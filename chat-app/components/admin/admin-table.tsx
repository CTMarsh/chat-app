'use client'

import { cn } from '@/lib/utils'

interface AdminTableProps {
  children: React.ReactNode
  className?: string
}

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className={cn('rounded-lg border divide-y', className)}>
      {children}
    </div>
  )
}

interface AdminTableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function AdminTableRow({ children, className, onClick }: AdminTableRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
