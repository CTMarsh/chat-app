'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: ReactNode
  title: string
  description?: ReactNode
  footer?: ReactNode
  icon?: ReactNode
  className?: string
}

/**
 * Constellation auth shell (Noah's Ark DESIGN-SYSTEM.md §4/§5).
 *
 * Split-pane showcase: the app's Higgsfield hero full-bleed under a navy
 * scrim on the left, a glassy form column over the constellation texture on
 * the right. On mobile the hero becomes the scrimmed backdrop and the card
 * floats over it. The hero pane deliberately commits to the dark brand world
 * in both themes; the form column follows the active theme for AA contrast.
 */
export function AuthCard({
  children,
  title,
  description,
  footer,
  icon,
  className,
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen bg-ark-void">
      {/* Hero pane — full-bleed splash + navy scrim */}
      <div className="absolute inset-0 lg:relative lg:flex-1">
        <Image
          src="/brand/chat-app-splash.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        {/* Navy scrim — lighter on desktop where copy sits, heavier on mobile behind the card */}
        <div className="absolute inset-0 bg-gradient-to-t from-ark-void via-ark-void/45 to-ark-void/15" />
        <div className="absolute inset-0 bg-ark-void/60 lg:hidden" />

        {/* Desktop hero statement */}
        <div className="absolute inset-0 hidden flex-col justify-between p-10 xl:p-14 lg:flex">
          <Link
            href="/"
            className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src="/chatark-logo.png"
              alt="ChatArk"
              width={40}
              height={40}
              className="rounded-xl shadow-glow"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-ark-ink">
              Chat<span className="text-ark-blue-bright">Ark</span>
            </span>
          </Link>

          <div className="max-w-lg">
            <p className="ark-label mb-4 text-ark-cyan">
              Noah&apos;s Ark &middot; Secure comms
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ark-ink xl:text-5xl">
              Every conversation, one constellation.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ark-ink-2">
              Real-time messaging for the whole crew — end-to-end accounted
              for, MFA on every hatch.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="ark-badge border border-ark-line bg-ark-surface/80 text-ark-ink-2">
                Realtime
              </span>
              <span className="ark-badge border border-ark-line bg-ark-surface/80 text-ark-ink-2">
                MFA enforced
              </span>
              <span className="ark-badge border border-ark-line bg-ark-surface/80 text-ark-ink-2">
                Self-hosted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div
        className={cn(
          'relative z-10 flex w-full flex-col items-center justify-center px-4 py-12',
          'lg:w-[480px] lg:shrink-0 xl:w-[540px]',
          'lg:border-l lg:border-ark-line lg:bg-background',
          'ark-texture'
        )}
      >
        <div className="w-full max-w-md">
          {/* Wordmark (mobile — sits over the scrimmed hero) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image
                src="/chatark-logo.png"
                alt="ChatArk"
                width={44}
                height={44}
                className="rounded-xl shadow-glow"
              />
              <span className="font-display text-xl font-semibold tracking-tight text-ark-ink">
                Chat<span className="text-ark-blue-bright">Ark</span>
              </span>
            </Link>
          </div>

          {/* Card */}
          <Card className={cn('overflow-hidden py-0', className)}>
            {/* Constellation accent — blue into cyan */}
            <div className="h-1 bg-gradient-to-r from-ark-blue via-ark-cyan to-transparent" />

            <CardHeader className="pb-4 pt-6 text-center">
              {icon && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-glow">
                  {icon}
                </div>
              )}
              <CardTitle className="font-display text-2xl font-semibold tracking-tight">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="px-6 pb-6">{children}</CardContent>

            {footer && (
              <CardFooter className="justify-center border-t bg-muted/40 px-6 py-4">
                {footer}
              </CardFooter>
            )}
          </Card>

          {/* Bottom text */}
          <p className="mt-6 text-center text-xs text-ark-ink-2 lg:text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="underline transition-colors hover:text-ark-blue-bright"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline transition-colors hover:text-ark-blue-bright"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
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
