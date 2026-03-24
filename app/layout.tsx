import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/layout/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bien Vivre à Pourrain — Portail des commissions",
  description: "Plateforme interne pour les élus de la commune de Pourrain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-[#FAF8F5]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
