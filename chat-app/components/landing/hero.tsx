import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, MessageSquare } from 'lucide-react'

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
              New: Real-time messaging is here
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Connect with anyone,{' '}
              <span className="text-primary">anywhere</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Experience seamless communication with our modern chat platform.
              Send messages, share files, and collaborate in real-time with
              friends, family, and colleagues.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/10"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1,000+</span>{' '}
                users already chatting
              </p>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative lg:ml-auto">
            <div className="relative rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-card p-2 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
              <div className="aspect-[4/3] rounded-xl bg-background/80 overflow-hidden">
                {/* Placeholder for app screenshot */}
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                  <div className="text-center p-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-xl shadow-primary/10">
                      <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      App Screenshot Placeholder
                    </p>
                  </div>
                </div>
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
