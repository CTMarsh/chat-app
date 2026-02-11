import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers - ChatArk',
  description: 'Join the ChatArk team and help build the future of secure messaging.',
}

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Careers</h1>
          <p className="text-muted-foreground mb-12">
            Join our team and help build the future of secure messaging.
          </p>

          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/30 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No open positions</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              We don&apos;t have any openings right now, but we&apos;re always interested in
              hearing from talented people. Drop us a line at{' '}
              <a href="mailto:careers@chatark.io" className="text-primary hover:underline">
                careers@chatark.io
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
