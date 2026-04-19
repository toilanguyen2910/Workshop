import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, firebaseConfigured } from '../lib/firebase'

type AuthState = {
  user: User | null
  loading: boolean
  authAvailable: boolean
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  authAvailable: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(firebaseConfigured)

  useEffect(() => {
    if (!firebaseConfigured || !auth) return
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authAvailable: firebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
