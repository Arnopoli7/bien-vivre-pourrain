import type { CompteRendu } from "@/types"

const ML = 18        // margin left
const MR = 18        // margin right
const MT = 18        // margin top
const MB = 18        // margin bottom
const PW = 210       // page width A4
const PH = 297       // page height A4
const CW = PW - ML - MR  // content width

// Retire les accents et caractères spéciaux pour le nom de fichier
function sanitize(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40)
}

// Charge le logo en base64 via canvas
async function chargerLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    const img = new Image()
    img.src = "/logo.jpg"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject()
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    return { data: canvas.toDataURL("image/jpeg", 0.9), ratio: img.naturalHeight / img.naturalWidth }
  } catch {
    return null
  }
}

export async function telechargerCompteRenduPDF(cr: CompteRendu, commissionNom: string) {
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  let y = MT
  let page = 1

  function checkPage(needed = 8) {
    if (y + needed > PH - MB - 12) {
      doc.addPage()
      page++
      y = MT
    }
  }

  function hr(color: [number, number, number] = [220, 220, 220], width = 0.3) {
    doc.setDrawColor(...color)
    doc.setLineWidth(width)
    doc.line(ML, y, PW - MR, y)
    y += 4
  }

  function sectionHeader(title: string) {
    checkPage(12)
    doc.setFillColor(180, 67, 46)
    doc.roundedRect(ML, y - 5, CW, 7, 1, 1, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text(title, ML + 3, y)
    doc.setTextColor(26, 26, 26)
    y += 5
  }

  function bullet(text: string, indent = 4) {
    checkPage(5)
    const lines = doc.splitTextToSize(text, CW - indent - 4)
    doc.text("•", ML + indent, y)
    doc.text(lines, ML + indent + 4, y)
    y += lines.length * 4.5 + 0.5
  }

  // ── LOGO ──
  const logo = await chargerLogo()
  if (logo) {
    const logoW = 44
    const logoH = logoW * logo.ratio
    doc.addImage(logo.data, "JPEG", (PW - logoW) / 2, y, logoW, logoH)
    y += logoH + 5
  } else {
    y += 8
  }

  // ── TITRE PRINCIPAL ──
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(26, 26, 26)
  doc.text("COMPTE RENDU DE RÉUNION", PW / 2, y, { align: "center" })
  y += 7

  // Commission
  doc.setFontSize(11)
  doc.setTextColor(180, 67, 46)
  doc.text(commissionNom, PW / 2, y, { align: "center" })
  y += 5

  // Date
  const dateFormatee = new Date(cr.date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text(dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1), PW / 2, y, { align: "center" })
  y += 5

  // Rédigé par
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Rédigé par : ${cr.redacteur}`, PW / 2, y, { align: "center" })
  y += 6

  hr([180, 67, 46], 0.6)

  // ── PRÉSENCES ──
  if (cr.presents.length > 0 || cr.absentsExcuses.length > 0) {
    sectionHeader("Présences")
    y += 3

    if (cr.presents.length > 0) {
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(26, 26, 26)
      doc.text(`Présents (${cr.presents.length}) :`, ML, y)
      y += 5
      doc.setFont("helvetica", "normal")
      for (const nom of cr.presents) bullet(nom)
      y += 2
    }

    if (cr.absentsExcuses.length > 0) {
      checkPage(8)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(26, 26, 26)
      doc.text(`Absents excusés (${cr.absentsExcuses.length}) :`, ML, y)
      y += 5
      doc.setFont("helvetica", "normal")
      for (const nom of cr.absentsExcuses) bullet(nom)
      y += 2
    }

    y += 3
  }

  // ── ORDRE DU JOUR ──
  if (cr.ordresDuJour.length > 0) {
    checkPage(12)
    sectionHeader("Ordre du jour")
    y += 3

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(26, 26, 26)
    cr.ordresDuJour.forEach((point, i) => {
      checkPage(6)
      const lines = doc.splitTextToSize(`${i + 1}.  ${point}`, CW - 6)
      doc.text(lines, ML + 3, y)
      y += lines.length * 4.8 + 0.5
    })
    y += 3
  }

  // ── CORPS DU COMPTE RENDU ──
  if (cr.corps.length > 0) {
    checkPage(12)
    sectionHeader("Corps du compte rendu")
    y += 3

    cr.corps.forEach((section, i) => {
      checkPage(12)

      // Titre de section
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(26, 26, 26)
      const titleLines = doc.splitTextToSize(`${i + 1}.  ${section.titre}`, CW)
      doc.text(titleLines, ML, y)
      y += titleLines.length * 5.5 + 1

      // Contenu
      if (section.contenu?.trim()) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)
        const contentLines = doc.splitTextToSize(section.contenu, CW - 6)
        for (const line of contentLines) {
          checkPage(5)
          doc.text(line, ML + 4, y)
          y += 4.8
        }
      } else {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(9)
        doc.setTextColor(160, 160, 160)
        doc.text("Aucune rédaction.", ML + 4, y)
        y += 4.8
      }

      y += 4
    })
  }

  // ── PIED DE PAGE sur toutes les pages ──
  const nbPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let p = 1; p <= nbPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(ML, PH - MB - 2, PW - MR, PH - MB - 2)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(160, 160, 160)
    doc.text("Mairie de Pourrain — Yonne (89)  ·  Bien Vivre à Pourrain", ML, PH - MB + 2)
    doc.text(`Page ${p} / ${nbPages}`, PW - MR, PH - MB + 2, { align: "right" })
  }

  // ── TÉLÉCHARGEMENT ──
  const filename = `CR_${sanitize(commissionNom)}_${cr.date}.pdf`
  doc.save(filename)
}
