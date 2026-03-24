import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { notes, commissionNom, date, apiKey } = await request.json()

  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "Clé API Anthropic manquante." }, { status: 400 })
  }
  if (!notes?.trim()) {
    return NextResponse.json({ error: "Les notes sont vides." }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Tu es le secrétaire général de la mairie de Pourrain (Yonne). Transforme ces notes brutes en compte rendu officiel de réunion de commission municipale.

Commission : ${commissionNom}
Période : ${date}

Notes brutes :
${notes}

Rédige un compte rendu structuré EXACTEMENT dans ce format, en français administratif formel :

COMPTE RENDU DE RÉUNION
Commission : ${commissionNom}
Date : ${date}

1. POINTS ABORDÉS
[Liste numérotée des points discutés lors de la réunion]

2. DÉCISIONS PRISES
[Liste numérotée des décisions arrêtées]

3. ACTIONS À MENER
[Liste numérotée des actions à engager, avec responsable et délai si mentionnés]

4. PROCHAINE RÉUNION
[Date et lieu de la prochaine réunion si mentionnés, sinon : À définir]

Sois précis, formel et complet. Si les notes sont insuffisantes sur un point, indique "Non précisé lors de cette réunion."`
    }],
  })

  const texte = message.content[0].type === "text" ? message.content[0].text : ""
  return NextResponse.json({ compteRendu: texte })
}
