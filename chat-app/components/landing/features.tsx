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
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need to stay connected
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform comes packed with powerful features designed to make
            communication effortless and enjoyable.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm bg-background">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
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
