import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import { ChatPreview } from './chat-preview'
import { ScrollToDemo } from './scroll-to-demo'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-lg shadow-primary/10 w-fit backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Secure real-time messaging
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Navigate your{' '}
              <span className="text-primary">conversations</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              ChatArk is a secure, real-time messaging platform built for teams.
              Share files, react with emoji, and collaborate — all protected by
              mandatory multi-factor authentication.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Come Aboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <ScrollToDemo />
            </div>

          </div>

          {/* Right Column - Image */}
          <div className="relative lg:ml-auto">
            <div className="relative rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-card p-2 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
              <div className="h-[360px] md:h-[400px] rounded-xl bg-background/80 overflow-hidden">
                <ChatPreview />
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
