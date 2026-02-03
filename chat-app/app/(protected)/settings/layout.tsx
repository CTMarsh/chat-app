import { SettingsSidebar } from '@/components/settings/settings-sidebar'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-muted/20 p-6 md:p-10 lg:p-14">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  )
}
