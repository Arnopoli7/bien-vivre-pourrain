import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "AIzaSyCdydx1nR_7zD0s9zJGT46QJJgJ2qjgt7A",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "bien-vivre-pourrain.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "bien-vivre-pourrain",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "bien-vivre-pourrain.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "936111996771",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:936111996771:web:8329f180a8f769c0a35d56",
}

console.log("[Firebase] config:", {
  apiKey:    firebaseConfig.apiKey?.slice(0, 10),
  projectId: firebaseConfig.projectId,
  source:    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "env" : "fallback",
})

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
