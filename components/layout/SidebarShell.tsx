"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

export default function SidebarShell({ children }: { children: React.ReactNode }) {
  const [sidebarOuvert, setSidebarOuvert] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOuvert} onClose={() => setSidebarOuvert(false)} />
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOuvert(true)} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </>
  )
}
