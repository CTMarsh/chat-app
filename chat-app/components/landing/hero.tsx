import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, MessageSquare } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit">
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
                    className="h-8 w-8 rounded-full border-2 border-background bg-muted"
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
            <div className="relative rounded-2xl border bg-gradient-to-b from-muted/50 to-muted p-2 shadow-2xl">
              <div className="aspect-[4/3] rounded-xl bg-background overflow-hidden">
                {/* Placeholder for app screenshot */}
                <div className="h-full w-full flex items-center justify-center bg-muted/30">
                  <div className="text-center p-8">
                    <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      App Screenshot Placeholder
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
