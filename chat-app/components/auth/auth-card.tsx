'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface AuthCardProps {
  children: ReactNode
  title: string
  description?: string
  footer?: ReactNode
  icon?: ReactNode
  className?: string
}

export function AuthCard({
  children,
  title,
  description,
  footer,
  icon,
  className,
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-60 w-60 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatApp</span>
          </Link>
        </div>

        {/* Card */}
        <Card
          className={cn(
            'overflow-hidden border-border/50 bg-card/80 backdrop-blur-xl',
            'shadow-2xl shadow-primary/5',
            'transition-all duration-300 hover:shadow-primary/10',
            className
          )}
        >
          {/* Gradient accent */}
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />

          <CardHeader className="pb-4 pt-6 text-center">
            {icon && (
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                {icon}
              </div>
            )}
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground/80">
                {description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-6">{children}</CardContent>

          {footer && (
            <CardFooter className="justify-center border-t bg-muted/30 px-6 py-4">
              {footer}
            </CardFooter>
          )}
        </Card>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

interface AuthInputWrapperProps {
  children: ReactNode
  icon: ReactNode
}

export function AuthInputWrapper({ children, icon }: AuthInputWrapperProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      {children}
    </div>
  )
}
