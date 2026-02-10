'use client'

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export function ScrollToDemo() {
  return (
    <Button
      size="lg"
      variant="outline"
      onClick={() => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
      }}
    >
      <Play className="mr-2 h-4 w-4" />
      Watch Demo
    </Button>
  )
}
