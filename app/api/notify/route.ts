import nodemailer from "nodemailer"
import { NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  console.log("GMAIL_USER:", process.env.GMAIL_USER)

  const { type, titre, commission, date, auteur, heure, lieu } = await request.json()

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
  } else if (type === "reunion") {
    subject = `[Bien Vivre à Pourrain] Nouvelle réunion — ${commission}`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #B4432E;">Nouvelle réunion programmée</h2>
        <p><b>Commission :</b> ${commission}</p>
        <p><b>Titre :</b> ${titre || ""}</p>
        <p><b>Date :</b> ${date}</p>
        <p><b>Heure :</b> ${heure}</p>
        <p><b>Lieu :</b> ${lieu}</p>
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
