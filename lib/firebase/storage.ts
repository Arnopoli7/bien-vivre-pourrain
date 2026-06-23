import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { app } from "./config"

const storage = getStorage(app)

export async function uploadFichier(file: File): Promise<{ url: string }> {
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const storageRef = ref(storage, `documents/${fileName}`)

  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)

  return { url }
}

export async function supprimerFichier(url: string): Promise<void> {
  const storageRef = ref(storage, url)
  await deleteObject(storageRef)
}
