"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Bell,
  DollarSign,
  AlertCircle,
  Settings,
  LogOut,
  GraduationCap,
  Building2,
  ClipboardList,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigationByRole: Record<string, { name: string; href: string; icon: any }[]> = {
  PRINCIPAL: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Departments', href: '/admin/departments', icon: Building2 },
    { name: 'Batches', href: '/admin/batches', icon: ClipboardList },
    { name: 'Students', href: '/admin/users?role=STUDENT', icon: Users },
    { name: 'Faculty', href: '/admin/users?role=FACULTY', icon: GraduationCap },
    { name: 'Courses', href: '/admin/subjects', icon: BookOpen },
    { name: 'Fees', href: '/admin/fees', icon: DollarSign },
    { name: 'Notices', href: '/admin/notices', icon: Bell },
    { name: 'Complaints', href: '/admin/complaints', icon: AlertCircle },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  HOD: [
    { name: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
    { name: 'My Department', href: '/hod/department', icon: Building2 },
    { name: 'Batches', href: '/hod/batches', icon: ClipboardList },
    { name: 'Faculty', href: '/hod/faculty', icon: GraduationCap },
    { name: 'Students', href: '/hod/students', icon: Users },
    { name: 'Courses', href: '/hod/courses', icon: BookOpen },
    { name: 'Fees', href: '/hod/fees', icon: DollarSign },
    { name: 'Attendance', href: '/hod/attendance', icon: Calendar },
    { name: 'Assignments', href: '/hod/assignments', icon: FileText },
    { name: 'Notices', href: '/hod/notices', icon: Bell },
    { name: 'Reports', href: '/hod/reports', icon: FileText },
    { name: 'Settings', href: '/hod/settings', icon: Settings },
  ],
  FACULTY: [
    { name: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Batches', href: '/faculty/batches', icon: Users },
    { name: 'My Subjects', href: '/faculty/subjects', icon: BookOpen },
    { name: 'Attendance', href: '/faculty/attendance', icon: Calendar },
    { name: 'Assignments', href: '/faculty/assignments', icon: FileText },
    { name: 'Grades', href: '/faculty/grades', icon: ClipboardList },
    { name: 'Fees', href: '/faculty/fees', icon: DollarSign },
    { name: 'Notices', href: '/faculty/notices', icon: Bell },
    { name: 'Settings', href: '/faculty/settings', icon: Settings },
  ],
  STUDENT: [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Batch', href: '/student/batch', icon: Users },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Attendance', href: '/student/attendance', icon: Calendar },
    { name: 'Assignments', href: '/student/assignments', icon: FileText },
    { name: 'Grades', href: '/student/grades', icon: ClipboardList },
    { name: 'Notices', href: '/student/notices', icon: Bell },
    { name: 'Fees', href: '/student/fees', icon: DollarSign },
    { name: 'Complaints', href: '/student/complaints', icon: AlertCircle },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ],
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    router.push('/login')
    return null
  }

  const navigation = navigationByRole[user.role] || []

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-obsidian transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-lime flex items-center justify-center text-obsidian font-bold">
                U
              </div>
              <h1 className="text-xl font-display font-bold text-white tracking-wide">
                UNI<span className="text-neon-lime">Manager</span>
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-neon-lime/10 text-neon-lime shadow-[inset_2px_0_0_0_#ccff00]'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-5 h-5 mr-3', isActive ? 'text-neon-lime' : 'text-white/40')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center text-white font-medium border border-white/10">
                {user.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-neon-lime truncate capitalize">
                  {user.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white/60 bg-white/5 hover:bg-destructive hover:text-white rounded-lg transition-colors border border-white/5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-4 bg-obsidian border-b border-white/5 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 text-white font-medium">UNI Manager</span>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
