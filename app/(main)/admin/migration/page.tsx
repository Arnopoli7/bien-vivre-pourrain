"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { getComptesRendus, getDocuments, addDocument } from "@/lib/firebase/firestore"
import type { CompteRendu, Document } from "@/types"

// Type élargi pour lire les données brutes de Firestore (commissionId peut être number)
type CRBrut = Omit<CompteRendu, "commissionId"> & { commissionId: unknown }

export default function MigrationDiagPage() {
  const { currentUser, commissions } = useApp()

  const [comptesRendus, setComptesRendus] = useState<CRBrut[]>([])
  const [docsCompteRendu, setDocsCompteRendu] = useState<Document[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [chargement, setChargement] = useState(false)
  const [migration, setMigration] = useState(false)

  if (currentUser && currentUser.identifiant !== "ArnaudP") {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">Cette page est réservée à l'administrateur.</p>
      </div>
    )
  }

  function log(msg: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString("fr-FR")}] ${msg}`])
  }

  async function chargerDiagnostic() {
    setChargement(true)
    setLogs([])
    log("Chargement des données Firebase…")
    try {
      const crs = (await getComptesRendus()) as unknown as CRBrut[]
      setComptesRendus(crs)
      log(`${crs.length} compte(s) rendu(s) trouvé(s) dans "comptes_rendus"`)

      const valides = crs.filter(cr => cr.statut === "valide")
      const brouillons = crs.filter(cr => cr.statut === "brouillon")
      const autresStatuts = crs.filter(cr => cr.statut !== "valide" && cr.statut !== "brouillon")
      log(`→ ${valides.length} avec statut "valide" | ${brouillons.length} "brouillon"`)
      if (autresStatuts.length > 0) {
        log(`⚠ ${autresStatuts.length} CR(s) avec statut inconnu : ${JSON.stringify(autresStatuts.map(cr => cr.statut))}`)
      }

      // Vérifier les commissionId
      const commissionMap = new Map(commissions.map(c => [c.id, c.nom]))
      for (const cr of valides) {
        const cid = cr.commissionId
        if (!cid) {
          log(`⚠ CR "${cr.titre ?? cr.id}" : commissionId est VIDE/NULL`)
        } else if (typeof cid === "number") {
          const nomCommission = commissionMap.get(String(cid))
          log(`⚠ CR "${cr.titre ?? cr.id}" : commissionId est un NOMBRE (${cid}) — doit être string`)
          log(`   → comme string "${String(cid)}" → commission = "${nomCommission ?? "INTROUVABLE"}"`)
        } else {
          const nomCommission = commissionMap.get(String(cid))
          log(`${nomCommission ? "✓" : "⚠"} CR "${cr.titre ?? cr.id}" : commissionId="${cid}" → "${nomCommission ?? "INTROUVABLE"}"`)
        }
      }

      const docs = await getDocuments()
      const docsCR = docs.filter(d => d.type === "compte_rendu")
      setDocsCompteRendu(docsCR)
      log(`${docs.length} document(s) total dans "documents" | ${docsCR.length} de type "compte_rendu"`)

      const existingCrIds = new Set(docs.map(d => d.compteRenduId).filter(Boolean))
      log(`→ compteRenduId indexés : [${Array.from(existingCrIds).join(", ")}]`)

      const manquants = valides.filter(cr => !existingCrIds.has(cr.id))
      log(`→ ${manquants.length} CR(s) validé(s) SANS document correspondant`)
      for (const cr of manquants) {
        log(`  ✗ Manquant : id="${cr.id}" titre="${cr.titre}" commissionId="${cr.commissionId}" date="${cr.date}"`)
      }

      log("── Diagnostic terminé ──")
    } catch (err) {
      log(`ERREUR : ${err}`)
    } finally {
      setChargement(false)
    }
  }

  async function lancerMigration() {
    setMigration(true)
    log("═══ DÉBUT MIGRATION MANUELLE ═══")
    try {
      const crs = (await getComptesRendus()) as unknown as CRBrut[]
      const docs = await getDocuments()
      const commissionMap = new Map(commissions.map(c => [c.id, c.nom]))
      const existingCrIds = new Set(docs.map(d => d.compteRenduId).filter(Boolean))

      const valides = crs.filter(cr => cr.statut === "valide")
      log(`${valides.length} CRs validés | ${existingCrIds.size} docs existants`)

      const manquants = valides.filter(cr => !existingCrIds.has(cr.id))
      log(`${manquants.length} document(s) à créer`)

      if (manquants.length === 0) {
        log("✓ Aucun document manquant — migration inutile")
        setMigration(false)
        return
      }

      let ok = 0
      let ko = 0
      for (const cr of manquants) {
        // Normaliser commissionId en string (gère le cas number)
        const commissionId = String(cr.commissionId ?? "")
        const nomCommission = commissionMap.get(commissionId) ?? ""
        const annexes = cr.annexes ?? []

        const doc: Document = {
          id: `doc-cr-${cr.id}`,
          titre: cr.titre ?? "Sans titre",
          commissionId,
          commission: nomCommission,
          annee: cr.annee,
          mois: cr.mois,
          date: cr.date,
          auteur: cr.redacteur,
          fichiers: annexes,
          type: "compte_rendu",
          statut: "validé",
          compteRenduId: cr.id,
          nbAnnexes: annexes.length > 0 ? annexes.length : undefined,
        }

        try {
          await addDocument(doc)
          log(`✓ Créé : "${doc.titre}" → commissionId="${commissionId}" (${nomCommission || "COMMISSION INCONNUE"})`)
          ok++
        } catch (err) {
          log(`✗ Erreur pour "${doc.titre}" : ${err}`)
          ko++
        }
      }

      log(`═══ FIN : ${ok} créé(s), ${ko} erreur(s) ═══`)
      await chargerDiagnostic()
    } catch (err) {
      log(`ERREUR FATALE : ${err}`)
    } finally {
      setMigration(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#B4432E]">Diagnostic migration</h1>
        <p className="text-sm text-gray-500 mt-1">Vérification et réparation des comptes rendus dans les commissions</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={chargerDiagnostic}
          disabled={chargement || migration}
          className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {chargement ? "Chargement…" : "Lancer le diagnostic"}
        </button>
        <button
          onClick={lancerMigration}
          disabled={chargement || migration || comptesRendus.length === 0}
          className="px-5 py-2.5 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {migration ? "Migration en cours…" : "Lancer la migration manuellement"}
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 overflow-auto max-h-72">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Logs</p>
          {logs.map((l, i) => (
            <p key={i} className={`text-xs font-mono leading-relaxed ${
              l.includes("ERREUR") || l.includes("✗") || l.includes("⚠")
                ? "text-[#F87171]"
                : l.includes("✓") || l.includes("FIN")
                  ? "text-[#86EFAC]"
                  : "text-gray-300"
            }`}>{l}</p>
          ))}
        </div>
      )}

      {/* Comptes rendus */}
      {comptesRendus.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Comptes rendus en base ({comptesRendus.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">ID</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">Titre</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">commissionId</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">type(cid)</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">statut</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">date</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">annee</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">mois</th>
                </tr>
              </thead>
              <tbody>
                {comptesRendus.map((cr, i) => {
                  const commissionMap = new Map(commissions.map(c => [c.id, c.nom]))
                  const cid = cr.commissionId
                  const cidStr = String(cid ?? "")
                  const cidType = typeof cid
                  const nomCommission = commissionMap.get(cidStr)
                  const estValide = cr.statut === "valide"
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${estValide ? "" : "opacity-50"}`}>
                      <td className="py-2 px-4 font-mono text-gray-600">{cr.id}</td>
                      <td className="py-2 px-4 text-[#1A1A1A] max-w-[200px] truncate">{cr.titre ?? "—"}</td>
                      <td className="py-2 px-4 font-mono">
                        <span className={!cid ? "text-red-500 font-bold" : "text-gray-700"}>
                          {cid != null ? String(cid) : "∅ VIDE"}
                        </span>
                        {nomCommission
                          ? <span className="text-gray-400 ml-1">({nomCommission})</span>
                          : cid != null
                            ? <span className="text-red-400 ml-1">INTROUVABLE</span>
                            : null
                        }
                      </td>
                      <td className="py-2 px-4">
                        <span className={cidType === "number" ? "text-orange-600 font-bold" : "text-gray-500"}>
                          {cidType}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          cr.statut === "valide" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {cr.statut ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">{cr.date}</td>
                      <td className="py-2 px-4 text-gray-600">{cr.annee}</td>
                      <td className="py-2 px-4 text-gray-600">{cr.mois}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents type compte_rendu */}
      {docsCompteRendu.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Documents type &quot;compte_rendu&quot; ({docsCompteRendu.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto max-h-64">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">ID document</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">Titre</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">commissionId</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">compteRenduId</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">statut</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500">date</th>
                </tr>
              </thead>
              <tbody>
                {docsCompteRendu.map((doc, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-4 font-mono text-gray-600 text-[10px]">{doc.id}</td>
                    <td className="py-2 px-4 text-[#1A1A1A] max-w-[180px] truncate">{doc.titre}</td>
                    <td className="py-2 px-4 font-mono text-gray-700">{doc.commissionId || "∅"}</td>
                    <td className="py-2 px-4 font-mono text-gray-500 text-[10px]">{doc.compteRenduId ?? "—"}</td>
                    <td className="py-2 px-4 text-gray-600">{doc.statut ?? "—"}</td>
                    <td className="py-2 px-4 text-gray-600">{doc.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comptesRendus.length === 0 && logs.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cliquez sur &quot;Lancer le diagnostic&quot; pour analyser la base de données.
        </div>
      )}
    </div>
  )
}
