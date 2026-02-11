import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - ChatArk',
  description: 'News, updates, and insights from the ChatArk team.',
}

const posts = [
  {
    slug: 'welcome-to-chatark',
    title: 'Welcome to ChatArk: Secure Messaging for Everyone',
    date: '11 February 2026',
    readingTime: '4 min read',
    excerpt:
      'Introducing ChatArk, a messaging platform built from the ground up with privacy and security at its core. Learn what we are building, why it matters, and what is coming next.',
  },
  {
    slug: 'security-first-approach',
    title: 'Our Security-First Approach to Messaging',
    date: '4 February 2026',
    readingTime: '4 min read',
    excerpt:
      'A deep dive into the security architecture behind ChatArk: mandatory MFA, row-level security, virus scanning, encryption, and the engineering decisions that keep your conversations safe.',
  },
  {
    slug: 'building-across-platforms',
    title: 'Building ChatArk Across Every Apple Platform',
    date: '28 January 2026',
    readingTime: '4 min read',
    excerpt:
      'How we built a single SwiftUI codebase that runs on iPhone, iPad, Mac, Apple Watch, and Vision Pro, with platform-specific adaptations, widgets, live activities, and a share extension.',
  },
]

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground mb-12">
            News, updates, and insights from the ChatArk team.
          </p>

          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <time>{post.date}</time>
                    <span aria-hidden="true">&middot;</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Read article
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
