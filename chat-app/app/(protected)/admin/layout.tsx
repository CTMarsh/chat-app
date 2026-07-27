import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Enforce AAL2 — the admin console is always MFA-gated. Distinguish the two
  // reasons a user can be below AAL2 so we send them somewhere that can actually
  // resolve it: an admin with NO verified TOTP factor must be routed to the
  // enrolment on-ramp (/mfa/setup), not /mfa/verify — the latter has nothing to
  // verify and silently bounces them to /chat, locking the admin out with no
  // guidance. Mirrors the routing logic in lib/supabase/proxy.ts.
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasVerifiedFactor = factors?.totp?.some(f => f.status === 'verified') ?? false
    redirect(hasVerifiedFactor ? '/mfa/verify' : '/mfa/setup')
  }

  // Check platform admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) {
    redirect('/chat')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r md:block">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Admin Header Bar */}
        <div className="relative border-b">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ark-crit via-ark-crit to-ark-amber" />
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-lg font-semibold">Platform Admin</h1>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" />
                Open Chat
              </Link>
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  )
}
