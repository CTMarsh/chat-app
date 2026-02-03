import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MessageSquare, Shield, Zap, Users, Bell, Globe } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Real-time Messaging',
    description:
      'Send and receive messages instantly with our lightning-fast infrastructure.',
  },
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description:
      'Your conversations are secure with military-grade encryption technology.',
  },
  {
    icon: Zap,
    title: 'Blazing Fast',
    description:
      'Optimized performance ensures your messages arrive in milliseconds.',
  },
  {
    icon: Users,
    title: 'Group Chats',
    description:
      'Create groups and collaborate with multiple people at once.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Never miss important messages with customizable notification settings.',
  },
  {
    icon: Globe,
    title: 'Cross-Platform',
    description:
      'Access your conversations from any device, anywhere in the world.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32 bg-muted/20">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Everything you need to stay connected
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform comes packed with powerful features designed to make
            communication effortless and enjoyable.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={feature.title} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader>
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10 transition-transform group-hover:scale-110">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
