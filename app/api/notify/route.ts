import nodemailer from "nodemailer"
import { NextRequest, NextResponse } from "next/server"
import { getMembresCommission } from "@/lib/commission-membres"
import { USERS_AUTH } from "@/lib/auth-data"

const DESTINATAIRES = [
  "pierre.maison@neuf.fr",
  "bellanger.pourrain@wanadoo.fr",
  "anne.virtel59@free.fr",
  "arnaudpoli@yahoo.fr",
  "clairevandaele@wanadoo.fr",
  "guillouet.melanie89@gmail.com",
  "laburthe.gilles@wanadoo.fr",
  "adelina.gallet@gmail.com",
  "abc.petitfrancois@gmail.com",
  "eva.koya@gmail.com",
  "fredindy@orange.fr",
  "celinebillardon@gmail.com",
  "denis.boivin89@gmail.com",
  "flavie.maison@hotmail.fr",
  "quentin.bellanger89@gmail.com",
  "marylineventura@orange.fr",
  "ymalaurent@gmail.com",
]

function getEmailsCommission(commissionId: string): string[] {
  const noms = getMembresCommission(commissionId)
  return USERS_AUTH
    .filter(u => noms.includes(u.nom) && u.email)
    .map(u => u.email)
}

export async function POST(request: NextRequest) {
  console.log("GMAIL_USER:", process.env.GMAIL_USER)

  const { type, titre, commission, commissionId, date, auteur, heure, lieu, id, ordresDuJour } = await request.json()

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  })

  let subject = ""
  let html = ""

  if (type === "document") {
    subject = `[Bien Vivre à Pourrain] Nouveau document — ${titre}`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #B4432E;">Nouveau document déposé</h2>
        <p><b>Commission :</b> ${commission}</p>
        <p><b>Titre :</b> ${titre}</p>
        <p><b>Date :</b> ${date}</p>
        <p><b>Déposé par :</b> ${auteur}</p>
        <br>
        <a href="https://bien-vivre-pourrain.vercel.app"
           style="background:#B4432E;color:white;padding:10px 20px;
           text-decoration:none;border-radius:5px;">
          Accéder au portail
        </a>
        <br><br>
        <small style="color:#888;">Mairie de Pourrain — Yonne (89)</small>
      </div>
    `
  } else if (type === "validation_requise") {
    subject = `[BVAP] Compte rendu à valider — ${titre}`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #B4432E;">Compte rendu à valider</h2>
        <p><b>${auteur}</b> vous a envoyé un compte rendu à valider.</p>
        <p><b>Commission :</b> ${commission}</p>
        <p><b>Titre :</b> ${titre}</p>
        <br>
        <a href="https://bien-vivre-pourrain.vercel.app/notes/${id}"
           style="background:#B4432E;color:white;padding:10px 20px;
           text-decoration:none;border-radius:5px;">
          Consulter et valider
        </a>
        <br><br>
        <small style="color:#888;">Mairie de Pourrain — Yonne (89)</small>
      </div>
    `
    try {
      await nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
      }).sendMail({
        from: '"Bien Vivre à Pourrain" <apoli.pourrain@gmail.com>',
        to: "pierre.maison@neuf.fr",
        subject,
        html,
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
  } else if (type === "reunion_modifiee") {
    const dateFr = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    subject = `[BVAP] Réunion modifiée — ${commission}`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #B4432E;">Réunion modifiée</h2>
        <p>La réunion a été modifiée.</p>
        <p><b>Commission :</b> ${commission}</p>
        <p><b>Nouvelle date :</b> ${dateFr}</p>
        <p><b>Nouvelle heure :</b> ${heure}</p>
        <p><b>Nouveau lieu :</b> ${lieu}</p>
        <br>
        <a href="https://bien-vivre-pourrain.vercel.app"
           style="background:#B4432E;color:white;padding:10px 20px;
           text-decoration:none;border-radius:5px;">
          Accéder au portail
        </a>
        <br><br>
        <small style="color:#888;">Mairie de Pourrain — Yonne (89)</small>
      </div>
    `
    if (commissionId) {
      const destinatairesCommission = getEmailsCommission(commissionId).filter(Boolean)
      if (destinatairesCommission.length > 0) {
        try {
          await transporter.sendMail({
            from: '"Bien Vivre à Pourrain" <apoli.pourrain@gmail.com>',
            to: destinatairesCommission.join(", "),
            subject,
            html,
          })
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: (error as Error).message }, { status: 500 })
        }
      }
    }
  } else if (type === "reunion") {
    const dateFr = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    subject = `[BVAP] Réunion ${commission} — ${dateFr} à ${heure}`

    const ordresDuJourHtml = ordresDuJour && ordresDuJour.length > 0
      ? `<h3 style="color:#B4432E;">Ordre du jour :</h3>
         <ol style="padding-left:20px;">
           ${(ordresDuJour as string[]).map(p => `<li>${p}</li>`).join("\n")}
         </ol>`
      : ""

    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #B4432E;">Convocation à la réunion de commission</h2>
        <p><b>Commission :</b> ${commission}</p>
        <p><b>Date :</b> ${dateFr}</p>
        <p><b>Heure :</b> ${heure}</p>
        <p><b>Lieu :</b> ${lieu}</p>
        ${ordresDuJourHtml}
        <br>
        <a href="https://bien-vivre-pourrain.vercel.app"
           style="background:#B4432E;color:white;padding:10px 20px;
           text-decoration:none;border-radius:5px;">
          Indiquer votre présence sur le portail
        </a>
        <br><br>
        <small style="color:#888;">Mairie de Pourrain — Yonne (89)</small>
      </div>
    `

    // Si on connaît la commission, envoyer uniquement à ses membres
    if (commissionId) {
      const destinatairesCommission = getEmailsCommission(commissionId).filter(Boolean)
      if (destinatairesCommission.length > 0) {
        try {
          await transporter.sendMail({
            from: '"Bien Vivre à Pourrain" <apoli.pourrain@gmail.com>',
            to: destinatairesCommission.join(", "),
            subject,
            html,
          })
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: (error as Error).message }, { status: 500 })
        }
      }
    }
  }

  try {
    console.log("Envoi email en cours...")
    await transporter.sendMail({
      from: '"Bien Vivre à Pourrain" <apoli.pourrain@gmail.com>',
      to: DESTINATAIRES.join(", "),
      subject,
      html,
    })
    console.log("Email envoyé avec succès")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log("Erreur email:", (error as Error).message)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
