"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { lireComptesRendus, sauvegarderCompteRendu } from "@/lib/comptes-rendus"
import { documentExistePourCompteRendu, supprimerDocumentsParCompteRenduId } from "@/lib/firebase/firestore"
import CompteRenduForm from "@/components/ui/CompteRenduForm"
import type { CompteRendu, Fichier } from "@/types"
import { formatFileSize, getFileColorClass } from "@/lib/utils"
import BoutonTelechargement from "@/components/ui/BoutonTelechargement"
import { telechargerCompteRenduPDF } from "@/lib/generer-pdf-cr"
import { getMembresCommission, getSuppleantsCommission } from "@/lib/commission-membres"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface PageProps {
  params: { id: string }
}

export default function CompteRenduDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { commissions, currentUser, ajouterDocument, users } = useApp()
  const [cr, setCr] = useState<CompteRendu | null | "loading">("loading")
  const [pdfEnCours, setPdfEnCours] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)
  const [afficherRenvoi, setAfficherRenvoi] = useState(false)
  const [msgRenvoi, setMsgRenvoi] = useState("")
  const [msgAction, setMsgAction] = useState("")

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

  // "Réunion Maire et Adjoints" : accès restreint aux 4 membres
  const REUNION_MA_ID = "20"
  const MEMBRES_REUNION_MA = ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Arnaud Poli"]
  if (cr.commissionId === REUNION_MA_ID && !MEMBRES_REUNION_MA.includes(currentUser?.nom ?? "")) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="text-gray-500 text-sm">Vous n'avez pas accès à ce compte rendu.</p>
        <Link href="/notes" className="text-sm text-[#B4432E] underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  // ── BROUILLON éditable ────────────────────────────────────────────────────
  const canEdit =
    cr.statut === "brouillon" &&
    (currentUser?.role === "maire" ||
      (currentUser?.role === "adjoint" && cr.redacteur === currentUser?.nom) ||
      (currentUser?.role === "redacteur" && cr.redacteur === currentUser?.nom) ||
      (getSuppleantsCommission(cr.commissionId).includes(currentUser?.nom ?? "") && cr.redacteur === currentUser?.nom))

  if (canEdit) {
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

  // ── BROUILLON non-éditable : membres + suppléants de la commission uniquement ──────────
  if (cr.statut === "brouillon" && !canEdit) {
    const membres = getMembresCommission(cr.commissionId)
    const suppleants = getSuppleantsCommission(cr.commissionId)
    const isMembre = membres.includes(currentUser?.nom ?? "") || suppleants.includes(currentUser?.nom ?? "")
    if (!isMembre) {
      return (
        <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
          <p className="text-4xl">🔒</p>
          <p className="text-gray-500 text-sm">Vous n'avez pas accès à ce compte rendu.</p>
          <Link href="/notes" className="text-sm text-[#B4432E] underline">
            Retour à la liste
          </Link>
        </div>
      )
    }
    // Membre ou suppléant de la commission : lecture seule, pas de boutons d'action
  }

  // Vrai si l'utilisateur est membre de la commission (non-rédacteur) qui consulte un brouillon
  const isBrouillonMembreReadOnly = cr.statut === "brouillon" && !canEdit

  // ── Actions maire pour en_attente ─────────────────────────────────────────
  const commission = commissions.find(c => c.id === cr.commissionId)
  const periode = `${MOIS_FR[cr.mois - 1]} ${cr.annee}`

  async function handleValiderEtClasser() {
    if (!cr || cr === "loading") return
    setActionEnCours(true)
    try {
      const crValide: CompteRendu = { ...cr, statut: "valide" }
      await sauvegarderCompteRendu(crValide)
      const dejaExiste = await documentExistePourCompteRendu(crValide.id)
      if (!dejaExiste) {
        const annexesCr = crValide.annexes ?? []
        const auteurUser = users.find(u => u.nom === crValide.redacteur)
        await ajouterDocument({
          id: `doc-cr-${crValide.id}`,
          titre: crValide.titre || "Sans titre",
          commissionId: crValide.commissionId || "",
          commission: commission?.nom || "",
          annee: crValide.annee,
          mois: crValide.mois,
          date: crValide.date || "",
          auteur: crValide.redacteur || "",
          auteurId: auteurUser?.id || "",
          fichiers: annexesCr,
          type: "compte_rendu",
          statut: "valide",
          compteRenduId: crValide.id || "",
          nbAnnexes: annexesCr.length || 0,
          validepar: currentUser?.nom || "",
          valideAt: new Date().toISOString(),
        })
      }
      setMsgAction(`Compte rendu validé et classé dans ${commission?.nom ?? "la commission"}.`)
      setTimeout(() => router.push("/notes"), 1000)
    } catch (err) {
      setMsgAction(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setActionEnCours(false)
    }
  }

  async function handleRenvoyerCorrection() {
    if (!cr || cr === "loading") return
    setActionEnCours(true)
    try {
      const crRenvoye: CompteRendu = {
        ...cr,
        statut: "brouillon",
        messageCorrection: msgRenvoi.trim() || undefined,
      }
      await sauvegarderCompteRendu(crRenvoye)
      setMsgAction("Compte rendu renvoyé pour correction.")
      setTimeout(() => router.push("/notes"), 1000)
    } catch (err) {
      setMsgAction(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setActionEnCours(false)
    }
  }

  async function handleDevalider() {
    if (!cr || cr === "loading") return
    const ok = window.confirm(
      "Voulez-vous dévalider ce compte rendu ?\nIl repassera en brouillon et sera retiré de la commission."
    )
    if (!ok) return
    setActionEnCours(true)
    try {
      const crBrouillon: CompteRendu = { ...cr, statut: "brouillon" }
      await sauvegarderCompteRendu(crBrouillon)
      await supprimerDocumentsParCompteRenduId(cr.id)
      setMsgAction("Compte rendu repassé en brouillon.")
      setTimeout(() => router.push("/notes"), 1000)
    } catch (err) {
      setMsgAction(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setActionEnCours(false)
    }
  }

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
  const personnesExterieures = cr.personnesExterieures ?? []

  const isMaire = currentUser?.role === "maire"

  // Badge de statut
  const statutBadge =
    cr.statut === "brouillon" ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 shrink-0">
        Brouillon
      </span>
    ) : cr.statut === "en_attente" ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 shrink-0">
        En attente de validation
      </span>
    ) : (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shrink-0">
        Validé
      </span>
    )

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
        <div className="no-print max-w-[210mm] mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/notes"
                className="text-sm text-gray-500 hover:text-[#B4432E] inline-flex items-center gap-1 shrink-0"
              >
                ← Retour
              </Link>
              {statutBadge}
              <h1 className="text-base font-semibold text-[#1A1A1A] truncate">
                {cr.titre ?? "Sans titre"}
              </h1>
            </div>
            {!isBrouillonMembreReadOnly && (
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {isMaire && cr.statut === "valide" && (
                  <button
                    onClick={handleDevalider}
                    disabled={actionEnCours}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-sm font-medium text-orange-600 border border-orange-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    🔓 Dévalider
                  </button>
                )}
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
            )}
          </div>

          {/* Message d'action (dévalider, etc.) */}
          {!isBrouillonMembreReadOnly && msgAction && cr.statut === "valide" && (
            <p className="text-sm text-green-700 font-medium">{msgAction}</p>
          )}

          {/* Message de correction (si renvoyé pour correction) */}
          {!isBrouillonMembreReadOnly && cr.messageCorrection && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Message du maire :</span> {cr.messageCorrection}
            </div>
          )}

          {/* Actions maire sur en_attente */}
          {!isBrouillonMembreReadOnly && isMaire && cr.statut === "en_attente" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-3">
              <p className="text-sm font-semibold text-blue-800">
                Ce compte rendu est en attente de votre validation.
              </p>
              {msgAction ? (
                <p className="text-sm text-green-700 font-medium">{msgAction}</p>
              ) : (
                <div className="flex items-start gap-3 flex-wrap">
                  <button
                    onClick={handleValiderEtClasser}
                    disabled={actionEnCours}
                    className="px-5 py-2 bg-[#5FAF5A] hover:bg-[#4a8f46] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Valider et classer
                  </button>
                  {!afficherRenvoi ? (
                    <button
                      onClick={() => setAfficherRenvoi(true)}
                      disabled={actionEnCours}
                      className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      Renvoyer pour correction
                    </button>
                  ) : (
                    <div className="flex-1 min-w-[280px] space-y-2">
                      <textarea
                        value={msgRenvoi}
                        onChange={e => setMsgRenvoi(e.target.value)}
                        placeholder="Message optionnel pour l'auteur…"
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleRenvoyerCorrection}
                          disabled={actionEnCours}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          Confirmer le renvoi
                        </button>
                        <button
                          onClick={() => { setAfficherRenvoi(false); setMsgRenvoi("") }}
                          className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-xl transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                          {personnesExterieures.includes(nom) && (
                            <span style={{ fontSize: "8pt", background: "#EBF5FB", color: "#1A5276", padding: "1px 5px", borderRadius: "8px", fontWeight: "600" }}>
                              Ext.
                            </span>
                          )}
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
                          {personnesExterieures.includes(nom) && (
                            <span style={{ fontSize: "8pt", background: "#EBF5FB", color: "#1A5276", padding: "1px 5px", borderRadius: "8px", fontWeight: "600" }}>
                              Ext.
                            </span>
                          )}
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Rédigé par : <strong>{cr.redacteur}</strong>
                  {getSuppleantsCommission(cr.commissionId).includes(cr.redacteur) && (
                    <span style={{ fontSize: "8pt", background: "#EBF5FB", color: "#1A5276", padding: "1px 6px", borderRadius: "8px", fontWeight: "600" }}>
                      Suppléant
                    </span>
                  )}
                </div>
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
