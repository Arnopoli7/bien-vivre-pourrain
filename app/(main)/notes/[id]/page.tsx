"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { lireComptesRendus } from "@/lib/comptes-rendus"
import CompteRenduForm from "@/components/ui/CompteRenduForm"
import type { CompteRendu, Fichier } from "@/types"
import { formatFileSize, getFileColorClass } from "@/lib/utils"
import BoutonTelechargement from "@/components/ui/BoutonTelechargement"
import { telechargerCompteRenduPDF } from "@/lib/generer-pdf-cr"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface PageProps {
  params: { id: string }
}

export default function CompteRenduDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { commissions, currentUser, aCommissionAcces } = useApp()
  const [cr, setCr] = useState<CompteRendu | null | "loading">("loading")
  const [pdfEnCours, setPdfEnCours] = useState(false)

  useEffect(() => {
    lireComptesRendus().then(all => {
      const found = all.find(c => c.id === params.id)
      setCr(found ?? null)
    })
  }, [params.id])

  if (cr === "loading") {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (!cr) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <p className="text-4xl">🔍</p>
        <p className="text-gray-500 text-sm">Compte rendu introuvable.</p>
        <Link href="/notes" className="text-sm text-[#B4432E] underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  // ── Accès refusé si la commission est inaccessible ───────────────────────
  if (!aCommissionAcces(cr.commissionId)) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="text-gray-500 text-sm">Vous n'avez pas accès à ce compte rendu.</p>
        <Link href="/commissions" className="text-sm text-[#B4432E] underline">
          Retour aux commissions
        </Link>
      </div>
    )
  }

  // ── BROUILLON : formulaire éditable ──────────────────────────────────────
  const canEdit =
    currentUser?.role === "maire" ||
    (currentUser?.role === "adjoint" && cr.redacteur === currentUser?.nom)

  if (cr.statut === "brouillon" && !canEdit) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="text-gray-500 text-sm">Vous ne pouvez pas modifier ce compte rendu.</p>
        <Link href="/notes" className="text-sm text-[#B4432E] underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  if (cr.statut === "brouillon") {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <Link
            href="/notes"
            className="text-sm text-gray-500 hover:text-[#B4432E] inline-flex items-center gap-1 mb-3"
          >
            ← Retour aux comptes rendus
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#B4432E]">Modifier le compte rendu</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
              Brouillon
            </span>
          </div>
        </div>
        <CompteRenduForm
          initialCR={cr}
          onSaved={(_id, _statut) => router.push("/notes")}
        />
      </div>
    )
  }

  // ── VALIDÉ : lecture seule format A4 ─────────────────────────────────────
  const commission = commissions.find(c => c.id === cr.commissionId)
  const periode = `${MOIS_FR[cr.mois - 1]} ${cr.annee}`

  async function handleTelechargerPDF() {
    setPdfEnCours(true)
    try {
      await telechargerCompteRenduPDF(cr as CompteRendu, commission?.nom ?? "Commission")
    } catch (err) {
      console.error("Erreur génération PDF :", err)
    } finally {
      setPdfEnCours(false)
    }
  }
  const dateReunion = new Date(cr.date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const annexes = cr.annexes ?? []

  return (
    <>
      {/* Styles print A4 */}
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; background: white !important; }
          body { background: white !important; }
          @page { size: A4; margin: 2cm; }
          .a4-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .a4-wrapper { background: white !important; padding: 0 !important; }
          .page-header { display: flex !important; }
          .page-footer { display: flex !important; }
        }
        @media screen {
          .a4-wrapper {
            background: #e8e8e8;
            padding: 32px 16px;
            min-height: 100vh;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 2cm;
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            border-radius: 2px;
            position: relative;
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #1A1A1A;
          }
        }
      `}</style>

      <div className="space-y-4 pb-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between no-print max-w-[210mm] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/notes"
              className="text-sm text-gray-500 hover:text-[#B4432E] inline-flex items-center gap-1 shrink-0"
            >
              ← Retour
            </Link>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shrink-0">
              Validé
            </span>
            <h1 className="text-base font-semibold text-[#1A1A1A] truncate">
              {cr.titre ?? "Sans titre"}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleTelechargerPDF}
              disabled={pdfEnCours}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#B4432E]/10 hover:bg-[#B4432E]/20 text-sm font-medium text-[#B4432E] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {pdfEnCours ? "…" : "⬇ PDF"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-xl transition-colors"
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>

        {/* Zone grisée simulant le bureau */}
        <div className="a4-wrapper">
          {/* Page A4 */}
          <div className="a4-page">

            {/* En-tête */}
            <div style={{ borderBottom: "2px solid #B4432E", paddingBottom: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src="/logo.jpg"
                    alt="Bien Vivre à Pourrain"
                    width={80}
                    height={80}
                    style={{ height: "auto" }}
                  />
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: "15pt", fontWeight: "bold", letterSpacing: "2px", color: "#1A1A1A", textTransform: "uppercase" }}>
                    Compte rendu de réunion
                  </div>
                  {cr.titre && cr.titre !== "Sans titre" && (
                    <div style={{ fontSize: "12pt", fontWeight: "600", color: "#1A1A1A", marginTop: "4px" }}>
                      {cr.titre}
                    </div>
                  )}
                </div>
                <div style={{ width: "80px", flexShrink: 0 }} />
              </div>
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <div style={{ fontSize: "12pt", fontWeight: "600", color: "#B4432E" }}>{commission?.nom}</div>
                <div style={{ fontSize: "11pt", color: "#555", marginTop: "2px", textTransform: "capitalize" }}>{dateReunion}</div>
                <div style={{ fontSize: "10pt", color: "#888", marginTop: "2px" }}>{periode}</div>
              </div>
            </div>

            {/* Présences */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", color: "#B4432E", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                Présences
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "11pt", fontWeight: "600", color: "#333", marginBottom: "6px" }}>
                    Présents ({cr.presents.length})
                  </div>
                  {cr.presents.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {cr.presents.map(nom => (
                        <li key={nom} style={{ fontSize: "11pt", color: "#333", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5FAF5A", flexShrink: 0, display: "inline-block" }} />
                          {nom}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ fontSize: "11pt", color: "#999", fontStyle: "italic" }}>Aucun</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "11pt", fontWeight: "600", color: "#333", marginBottom: "6px" }}>
                    Absents excusés ({cr.absentsExcuses.length})
                  </div>
                  {cr.absentsExcuses.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {cr.absentsExcuses.map(nom => (
                        <li key={nom} style={{ fontSize: "11pt", color: "#333", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F2C94C", flexShrink: 0, display: "inline-block" }} />
                          {nom}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ fontSize: "11pt", color: "#999", fontStyle: "italic" }}>Aucun</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ordre du jour */}
            {cr.ordresDuJour.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", color: "#B4432E", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                  Ordre du jour
                </div>
                <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cr.ordresDuJour.map((point, i) => (
                    <li key={i} style={{ fontSize: "11pt", color: "#333", marginBottom: "4px", display: "flex", gap: "8px" }}>
                      <span style={{ fontWeight: "600", color: "#888", minWidth: "20px" }}>{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Corps */}
            {cr.corps.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", color: "#B4432E", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                  Corps du compte rendu
                </div>
                {cr.corps.map((section, i) => (
                  <div key={i} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11pt", fontWeight: "bold", color: "#1A1A1A", marginBottom: "6px", borderBottom: "1px solid #f0f0f0", paddingBottom: "3px" }}>
                      {i + 1}. {section.titre}
                    </div>
                    {section.contenu ? (
                      <p style={{ fontSize: "11pt", color: "#333", whiteSpace: "pre-wrap", lineHeight: "1.7", margin: 0 }}>
                        {section.contenu}
                      </p>
                    ) : (
                      <p style={{ fontSize: "11pt", color: "#999", fontStyle: "italic", margin: 0 }}>Aucune rédaction.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Annexes */}
            {annexes.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", color: "#B4432E", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                  Annexes ({annexes.length})
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {annexes.map((f, i) => (
                    <li key={i} style={{ fontSize: "11pt", color: "#333", marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "13pt" }}>📎</span>
                      <span style={{ flex: 1, fontWeight: "500" }}>{f.nom}</span>
                      <span style={{ fontSize: "10pt", color: "#888" }}>{formatFileSize(f.taille)}</span>
                      <BoutonTelechargement fichier={f} className="no-print" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pied de page */}
            <div style={{ borderTop: "1px solid #ddd", paddingTop: "12px", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ fontSize: "10pt", color: "#666" }}>
                <div style={{ fontWeight: "600", color: "#1A1A1A" }}>Mairie de Pourrain — Yonne (89)</div>
                <div>Rédigé par : <strong>{cr.redacteur}</strong></div>
                <div>
                  Date de rédaction :{" "}
                  <strong>{new Date(cr.dateRedaction + "T12:00:00").toLocaleDateString("fr-FR")}</strong>
                </div>
              </div>
              <div style={{ fontSize: "10pt", color: "#888" }}>
                Page 1
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
