"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useApp } from "@/lib/app-context"

const navItems = [
  { href: "/dashboard",   label: "Tableau de bord",  icon: "🏠",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/commissions", label: "Commissions",       icon: "📋",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/documents",   label: "Documents",         icon: "📁",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/calendrier",  label: "Calendrier",        icon: "📅",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/infos-elus",  label: "Infos Élus",        icon: "📌",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/notes",       label: "Comptes rendus",    icon: "📝",  roles: ["maire", "adjoint"] },
  { href: "/search",      label: "Recherche",         icon: "🔍",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/admin",       label: "Administration",    icon: "⚙️", roles: ["maire"] },
  { href: "/corbeille",   label: "Corbeille",         icon: "🗑️", roles: ["maire", "adjoint", "conseiller"] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { corbeilleDocuments, currentUser } = useApp()
  const role = currentUser?.role ?? "conseiller"
  const nbCorbeille = corbeilleDocuments.length

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="w-72 min-h-screen bg-white text-[#1A1A1A] flex flex-col fixed left-0 top-0 z-40 border-r-2 border-[#F2C94C]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <Image
          src="/logo.jpg"
          alt="Bien Vivre à Pourrain"
          width={160}
          height={60}
          style={{ maxWidth: "160px", height: "auto", background: "transparent" }}
        />
        <p className="text-[11px] text-[#1A1A1A]/50 leading-tight mt-2">Portail des commissions</p>
      </div>

      {/* Navigation principale */}
      <nav className="px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/40">
          Navigation
        </p>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const badge = item.href === "/corbeille" && nbCorbeille > 0 ? nbCorbeille : null
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all
                ${isActive
                  ? "bg-[#FFF8E8] text-[#B4432E] border-l-4 border-[#B4432E] pl-[10px]"
                  : "text-[#1A1A1A]/60 hover:bg-[#FAF8F5] hover:text-[#1A1A1A]"
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#B4432E] text-white leading-none">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
