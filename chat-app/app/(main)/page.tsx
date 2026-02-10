import { Header, Hero, Features, DemoSection, Footer } from '@/components/landing'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <DemoSection />
      </main>
      <Footer />
    </div>
  )
}
