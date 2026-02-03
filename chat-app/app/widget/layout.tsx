import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat Widget',
  description: 'Embedded chat widget',
}

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
