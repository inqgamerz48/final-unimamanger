"use client"

import { Suspense } from 'react'
import AdminUsersContent from './AdminUsersContent'

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
    </div>}>
      <AdminUsersContent />
    </Suspense>
  )
}
