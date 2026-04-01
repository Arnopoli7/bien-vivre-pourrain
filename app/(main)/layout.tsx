import SidebarShell from "@/components/layout/SidebarShell"
import AuthGuard from "@/components/layout/AuthGuard"
import FirebaseLoadingGuard from "@/components/layout/FirebaseLoadingGuard"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#FAF8F5]">
        <SidebarShell>
          <FirebaseLoadingGuard>
            {children}
          </FirebaseLoadingGuard>
        </SidebarShell>
      </div>
    </AuthGuard>
  )
}
