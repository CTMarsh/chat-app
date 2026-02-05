'use client'

interface SkipLinkProps {
  /** The ID of the element to skip to (without the # prefix) */
  href: string
  /** The text displayed in the skip link */
  children: React.ReactNode
}

/**
 * A skip-to-content link that is only visible when focused.
 * Place this at the very top of the page layout for keyboard users to bypass navigation.
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={`#${href}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  )
}
