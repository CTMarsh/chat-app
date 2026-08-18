'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: ReactNode
  title: string
  description?: ReactNode
  footer?: ReactNode
  /** Accepted for API compatibility; the split shell carries the brand mark instead. */
  icon?: ReactNode
  className?: string
}

/**
 * Constellation auth shell (Noah's Ark DESIGN-SYSTEM.md §4/§5) — the estate's
 * split login composition, matching PhotoVault's AuthShell and MixVault's
 * Login (the gold standard): full-bleed Higgsfield hero as the left pane with
 * the brand statement anchored bottom-left, the form in a fixed-width right
 * pane that blends into the void via the scrim gradient. On mobile the hero
 * goes full-bleed behind a glassy card. The `dark` class scopes the whole
 * surface to the Constellation dark theme regardless of the site theme —
 * every login in the estate commits to the dark brand world.
 */
export function AuthCard({
  children,
  title,
  description,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="dark relative flex min-h-[100dvh] w-full overflow-x-hidden bg-ark-void text-foreground">
      {/* Hero art — full-bleed on mobile (behind the card), left pane on desktop */}
      <div className="absolute inset-0 overflow-hidden lg:relative lg:inset-auto lg:flex-1">
        <Image
          src="/brand/chat-app-splash.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
        {/* Navy scrim: keeps the art luminous but text readable; blends into
            the void form pane on the right edge (desktop). */}
        <div className="absolute inset-0 bg-gradient-to-t from-ark-void via-ark-void/50 to-ark-void/20 lg:bg-gradient-to-r lg:from-ark-void/40 lg:via-transparent lg:to-ark-void" />

        {/* Brand statement over the art, anchored bottom-left (desktop only) */}
        <div className="absolute bottom-ark-7 left-ark-7 right-ark-8 z-10 hidden lg:block">
          <Link
            href="/"
            className="mb-ark-stack flex w-fit items-center gap-ark-inline transition-opacity hover:opacity-80"
          >
            <Image
              src="/chatark-logo.png"
              alt=""
              width={40}
              height={40}
              className="rounded-xl shadow-glow"
            />
            <span className="font-display text-ark-lead font-semibold text-ark-ink">
              Chat<span className="text-ark-blue-bright">Ark</span>
            </span>
          </Link>
          {/* The one heading that has to carry: stat role, hero at xl. */}
          <h2 className="font-display text-ark-stat font-semibold text-ark-ink xl:text-ark-hero">
            Every conversation, one constellation.
          </h2>
          <p className="mt-ark-inline max-w-md text-ark-body text-ark-ink-2">
            Self-hosted messaging for the people who matter — private by
            design, real-time by default.
          </p>
        </div>
      </div>

      {/* Form pane — fixed width on desktop, over the hero on mobile */}
      {/* ~38% form pane against the ~62% hero (canonical split), floored so the
          form never collapses at the lg breakpoint */}
      <div className="relative z-10 flex w-full min-w-0 flex-1 items-center justify-center px-ark-stack py-ark-section sm:px-ark-5 lg:w-[30rem] lg:flex-none">
        <div className="w-full max-w-[400px]">
          {/* Glassy card on mobile (over the hero); flat on the desktop void pane */}
          <div
            className={cn(
              'rounded-[16px] border border-ark-line bg-ark-surface/80 p-ark-panel shadow-card backdrop-blur-md sm:p-ark-5',
              'lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none',
              className
            )}
          >
            {/* Compact brand header — mobile only (desktop carries it on the hero) */}
            <Link
              href="/"
              className="mb-ark-5 flex w-fit items-center gap-ark-inline transition-opacity hover:opacity-80 lg:hidden"
            >
              <Image
                src="/chatark-logo.png"
                alt=""
                width={40}
                height={40}
                className="rounded-xl shadow-glow"
              />
              <span className="font-display text-ark-lead font-semibold text-ark-ink">
                Chat<span className="text-ark-blue-bright">Ark</span>
              </span>
            </Link>

            <p className="mb-ark-inline font-mono text-ark-micro uppercase text-ark-cyan">
              Noah&apos;s Ark &middot; Secure comms
            </p>
            <h1 className="mb-ark-1 font-display text-ark-stat font-semibold text-ark-ink">
              {title}
            </h1>
            {description && (
              <p className="text-ark-body text-ark-ink-2">{description}</p>
            )}

            <div className="mt-ark-5">{children}</div>

            {footer && (
              <div className="mt-ark-stack text-center text-ark-body text-ark-ink-2">
                {footer}
              </div>
            )}
          </div>

          <p className="mt-ark-section text-center font-mono text-ark-micro uppercase text-ark-ink-3">
            ChatArk &middot; Noah&apos;s Ark
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
      <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-ark-ink-3">
        {icon}
      </div>
      {children}
    </div>
  )
}
