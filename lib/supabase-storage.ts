import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET = "Documents"

/**
 * Upload d'un fichier vers Supabase Storage (bucket "Documents").
 * Retourne l'URL publique du fichier.
 */
export async function uploadFichier(file: File): Promise<{ url: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // DIAGNOSTIC
  console.log("[Supabase Storage] === Début uploadFichier ===")
  console.log("[Supabase Storage] Fichier :", { nom: file.name, type: file.type, taille: file.size })
  console.log("[Supabase Storage] URL Supabase :", supabaseUrl || "(vide — NEXT_PUBLIC_SUPABASE_URL manquant)")
  console.log("[Supabase Storage] Bucket :", BUCKET)
  console.log("[Supabase Storage] Path généré :", path)

  const { data, error } = await supabase.storage
    .from('Documents')
    .upload(path, file)

  console.log('Supabase data:', data)
  console.log('Supabase error:', JSON.stringify(error))

  if (error) throw new Error(error.message)

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  console.log("[Supabase Storage] URL publique :", urlData.publicUrl)

  return { url: urlData.publicUrl }
}
