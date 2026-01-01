import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, getIdToken, getIdTokenResult } from 'firebase/auth'

// Firebase config from env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider)
  const user = result.user
  const token = await getIdToken(user, true)
  const tokenResult = await getIdTokenResult(user, true)
  return { user, token, claims: tokenResult.claims }
}

export const signOut = () => fbSignOut(auth)

export { auth, onAuthStateChanged, getIdToken, getIdTokenResult }
