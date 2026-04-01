"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useApp } from "@/lib/app-context"

const navItems = [
  { href: "/dashboard",      label: "Tableau de bord",  icon: "🏠",  roles: ["maire", "adjoint", "conseiller", "secretaire"] },
  { href: "/commissions",    label: "Commissions",       icon: "📋",  roles: ["maire", "adjoint", "conseiller", "secretaire"] },
  { href: "/documents",      label: "Documents",         icon: "📁",  roles: ["maire", "adjoint", "conseiller", "secretaire"] },
  { href: "/calendrier",     label: "Calendrier",        icon: "📅",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/infos-elus",     label: "Infos Élus",        icon: "📌",  roles: ["maire", "adjoint", "conseiller", "secretaire"] },
  { href: "/notes",          label: "Comptes rendus",    icon: "📝",  roles: ["maire", "adjoint"] },
  { href: "/search",         label: "Recherche",         icon: "🔍",  roles: ["maire", "adjoint", "conseiller", "secretaire"] },
  { href: "/admin",          label: "Administration",    icon: "⚙️", roles: ["maire"] },
  { href: "/presence-elus",  label: "Présence Élus",     icon: "📊",  roles: ["maire", "adjoint", "conseiller"] },
  { href: "/corbeille",      label: "Corbeille",         icon: "🗑️", roles: ["maire", "adjoint"] },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { corbeilleDocuments, currentUser, absences } = useApp()
  const role = currentUser?.role ?? "conseiller"
  const nbCorbeille = corbeilleDocuments.length
  const todayISO = new Date().toISOString().slice(0, 10)
  const nbAbsentsAujourdhui = absences.filter(a => a.dateDebut <= todayISO && a.dateFin >= todayISO).length

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <>
      {/* Overlay backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
    <aside className={`w-72 min-h-screen bg-white text-[#1A1A1A] flex flex-col fixed left-0 top-0 z-40 border-r-2 border-[#F2C94C] transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
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
          const badge =
            (item.href === "/corbeille" && nbCorbeille > 0) ? nbCorbeille :
            (item.href === "/presence-elus" && nbAbsentsAujourdhui > 0) ? nbAbsentsAujourdhui :
            null
          const badgeColor = item.href === "/presence-elus" ? "bg-red-500" : "bg-[#B4432E]"
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeColor} text-white leading-none`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
    </>
  )
}
