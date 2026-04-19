import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId
)

let app: FirebaseApp | undefined
let auth: Auth | undefined

if (firebaseConfigured) {
  app = initializeApp(cfg)
  auth = getAuth(app)
}

export { auth }

const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase chưa được cấu hình')
  await signInWithPopup(auth, provider)
}

export async function logOut() {
  if (!auth) return
  await signOut(auth)
}
