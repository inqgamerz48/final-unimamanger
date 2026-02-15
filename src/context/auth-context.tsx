"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Optimistic load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('params_user_cache')
      if (cached) {
        try {
          setUser(JSON.parse(cached))
          setLoading(false) // Show UI immediately while verifying in background
        } catch (e) {
          console.error('Cache parse error', e)
          localStorage.removeItem('params_user_cache')
        }
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken()
          document.cookie = `firebase-token=${token}; path=/`

          // Send token in Authorization header instead of UID
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            localStorage.setItem('params_user_cache', JSON.stringify(userData))
          } else {
            console.error('Auth check failed, clearing cache')
            setUser(null)
            localStorage.removeItem('params_user_cache')
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Don't clear user immediately if it's just a network error, allow optimistic UI
          if (!user) setUser(null)
        }
      } else {
        document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setUser(null)
        localStorage.removeItem('params_user_cache')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await firebaseSignOut(auth)
    document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    setFirebaseUser(null)
    localStorage.removeItem('params_user_cache')
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
