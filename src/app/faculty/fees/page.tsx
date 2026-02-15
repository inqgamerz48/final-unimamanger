'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Users,
  Eye
} from 'lucide-react'

interface Fee {
  id: string
  studentId: string
  student: {
    fullName: string
    email: string
    studentId: string
    department: {
      name: string
      code: string
    }
    enrollments: {
      batch: {
        name: string
        year: number
        semester: number
      }
    }[]
  }
  amount: number
  amountPaid: number
  dueDate: string
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED'
  feeType: string
  paidAt: string | null
  paymentMode: string | null
  description: string | null
  academicYear: string
}

export default function FacultyFees() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [fees, setFees] = useState<Fee[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    academicYear: '2024-2025',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      fetchFees()
    }
  }, [user, filters, currentPage])

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (firebaseUser?.uid) {
      headers['x-firebase-uid'] = firebaseUser.uid
    }
    return headers
  }

  const fetchFees = async () => {
    try {
      setLoadingData(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', '50')
      
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.academicYear) queryParams.append('academicYear', filters.academicYear)
      
      const res = await fetch(`/api/faculty/fees?${queryParams}`, {
        headers: getAuthHeaders(),
      })
      
      if (res.ok) {
        const data = await res.json()
        setFees(data.fees)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      PARTIALLY_PAID: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      PAID: 'bg-green-500/10 text-green-500 border-green-500/20',
      OVERDUE: 'bg-red-500/10 text-red-500 border-red-500/20',
      WAIVED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    }
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      PARTIALLY_PAID: 'Partially Paid',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      WAIVED: 'Waived',
    }
    return (
      <Badge className={styles[status] || styles.PENDING}>
        {labels[status] || status}
      </Badge>
    )
  }

  // Calculate statistics
  const stats = {
    totalFees: fees.length,
    paidFees: fees.filter(f => f.status === 'PAID').length,
    pendingFees: fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE').length,
    totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
    collectedAmount: fees.reduce((sum, f) => sum + f.amountPaid, 0),
  }

  if (loading || user?.role !== 'FACULTY') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Student Fees</h1>
          <p className="text-white/50 mt-1">View fee status for students in your classes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Total Students</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFees}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Fees Paid</p>
                  <p className="text-2xl font-bold text-green-500">{stats.paidFees}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pendingFees}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Collection Rate</p>
                  <p className="text-2xl font-bold text-neon-lime">
                    {stats.totalAmount > 0 
                      ? ((stats.collectedAmount / stats.totalAmount) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-neon-lime" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                <Input
                  placeholder="Search student..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'ALL' ? '' : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.academicYear}
                onValueChange={(value) => setFilters({ ...filters, academicYear: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fees Table */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Student Fee Status</CardTitle>
            <CardDescription className="text-white/50">
              View-only access to student fees in your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No fee records found for your classes
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Batch</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Due Date</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{fee.student.fullName}</p>
                            <p className="text-white/50 text-sm">{fee.student.studentId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {fee.student.enrollments[0] && (
                            <span className="text-white/70">
                              {fee.student.enrollments[0].batch.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white/70">{fee.feeType.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">₹{fee.amount.toLocaleString()}</p>
                            {fee.status === 'PARTIALLY_PAID' && (
                              <p className="text-white/50 text-sm">Paid: ₹{fee.amountPaid.toLocaleString()}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/70">
                          {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(fee.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <p className="text-white/50 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-white/10 text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-white/10 text-white disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
