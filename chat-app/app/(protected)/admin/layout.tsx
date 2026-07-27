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

  // Verify MFA
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    redirect('/mfa/verify')
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
