import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import { Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - ChatArk',
  description: 'News, updates, and insights from the ChatArk team.',
}

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground mb-12">
            News, updates, and insights from the ChatArk team.
          </p>

          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/30 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Newspaper className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Coming soon</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              We&apos;re working on articles about secure messaging, product updates, and
              engineering insights. Check back soon.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
