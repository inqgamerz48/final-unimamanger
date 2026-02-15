"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Pin, Clock } from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  isPinned: boolean
  createdAt: string
  postedBy: {
    fullName: string
  }
}

export default function StudentNotices() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const getAuthHeaders = () => {
    if (!firebaseUser) return { 'Content-Type': 'application/json' }
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchNotices()
    }
  }, [user])

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/student/notices', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotices(data)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>
      case 'HIGH':
        return <Badge variant="warning">High</Badge>
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge>Normal</Badge>
    }
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const pinnedNotices = notices.filter(n => n.isPinned)
  const regularNotices = notices.filter(n => !n.isPinned)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Notices & Announcements</h1>
          <p className="text-white/50 mt-1">Stay updated with latest announcements</p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            No notices available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Notices */}
            {pinnedNotices.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <Pin className="h-5 w-5 text-neon-lime" />
                  Pinned Notices
                </h2>
                {pinnedNotices.map((notice) => (
                  <Card key={notice.id} className="bg-charcoal border-neon-lime/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{notice.title}</h3>
                            {getPriorityBadge(notice.priority)}
                          </div>
                          <p className="text-white/70 mt-2">{notice.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
                            <span>By {notice.postedBy.fullName}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(notice.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Regular Notices */}
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Notices
              </h2>
              {regularNotices.map((notice) => (
                <Card key={notice.id} className="bg-charcoal border-white/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{notice.title}</h3>
                          {getPriorityBadge(notice.priority)}
                        </div>
                        <p className="text-white/70 mt-2">{notice.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
                          <span>By {notice.postedBy.fullName}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(notice.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
