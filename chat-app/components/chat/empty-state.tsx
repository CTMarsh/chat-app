'use client'

import Image from 'next/image'

const FEATURES = ['Direct messages', 'Group chats', 'File sharing', 'Reactions']

export function EmptyState() {
  return (
    <div className="ark-texture relative flex h-full flex-col items-center justify-center p-8 text-center">
      {/* Constellation glow bed */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-ark-blue/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-ark-cyan/10 blur-3xl" />
      </div>

      <div className="relative">
        {/* Higgsfield empty-state art, feathered into the ground */}
        <div className="relative mx-auto h-52 w-52 md:h-64 md:w-64">
          <div className="absolute inset-0 rounded-full bg-ark-blue/15 blur-2xl" />
          <div className="relative h-full w-full overflow-hidden rounded-full border border-ark-line shadow-glow">
            <Image
              src="/brand/empty-constellation.png"
              alt=""
              fill
              sizes="(max-width: 768px) 208px, 256px"
              className="object-cover"
            />
            {/* keep the art anchored to the navy ground in both themes */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-ark-void/50 to-transparent" />
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight">
          Your constellation is quiet
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Pick a conversation from the sidebar, or start a new one — each chat
          becomes another light on the map.
        </p>

        {/* Feature hints */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURES.map((feature) => (
            <span
              key={feature}
              className="ark-badge border border-border bg-muted/60 text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
