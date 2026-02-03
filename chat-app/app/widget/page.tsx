'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { WidgetChat } from '@/components/widget/widget-chat'

function WidgetContent() {
  const searchParams = useSearchParams()
  const embedToken = searchParams.get('token')

  if (!embedToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Widget configuration error</p>
      </div>
    )
  }

  return <WidgetChat embedToken={embedToken} />
}

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <WidgetContent />
    </Suspense>
  )
}
