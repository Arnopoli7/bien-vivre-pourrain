import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"
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
        <Sidebar />
        <div className="flex-1 ml-72 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 p-6">
            <FirebaseLoadingGuard>
              {children}
            </FirebaseLoadingGuard>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
