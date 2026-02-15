"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        // Redirect based on role
        switch (user.role) {
          case 'PRINCIPAL':
            router.push('/admin/dashboard')
            break
          case 'HOD':
            router.push('/hod/dashboard')
            break
          case 'FACULTY':
            router.push('/faculty/dashboard')
            break
          case 'STUDENT':
            router.push('/student/dashboard')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return null
}
