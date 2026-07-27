'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { WidgetChat } from '@/components/widget/widget-chat'

function WidgetContent() {
  const searchParams = useSearchParams()
  const embedToken = searchParams.get('token')

  if (!embedToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Widget configuration error</p>
      </div>
    )
  }

  return <WidgetChat embedToken={embedToken} />
}

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <WidgetContent />
    </Suspense>
  )
}
