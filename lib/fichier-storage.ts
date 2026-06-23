// Stockage des fichiers en base64 dans localStorage.
// Firestore ne stocke que les métadonnées + storageKey.
// Limite : 2 Mo par fichier.

export const TAILLE_MAX = 2 * 1024 * 1024 // 2 Mo

export function genererStorageKey(): string {
  return `fichier_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function sauvegarderFichier(key: string, base64: string): void {
  try {
    localStorage.setItem(key, base64)
  } catch {
    throw new Error("Espace de stockage local insuffisant. Supprimez d'anciens fichiers.")
  }
}

export function lireFichier(key: string): string | null {
  return localStorage.getItem(key)
}

export function supprimerFichier(key: string): void {
  localStorage.removeItem(key)
}

export function lireEnBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export function telechargerDepuisBase64(nom: string, type: string, base64: string): void {
  const parts = base64.split(',')
  const byteCharacters = atob(parts[1] ?? parts[0])
  const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0))
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
