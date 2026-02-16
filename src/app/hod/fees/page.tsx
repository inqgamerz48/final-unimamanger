'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus, 
  Search, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  amountPaid?: number
  dueDate: string
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED'
  feeType: string
  paidAt: string | null
  paymentMode: string | null
  description: string | null
  academicYear: string
  remarks: string | null
  markedBy: {
    fullName: string
  } | null
}

interface Stats {
  totalFees: number
  pendingFees: number
  paidFees: number
  partiallyPaidFees: number
  overdueFees: number
  totalAmount: number
  collectedAmount: number
  collectionRate: string
}

export default function HODFees() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [fees, setFees] = useState<Fee[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [loadingData, setLoadingData] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    feeType: '',
    batchId: '',
    academicYear: '2024-2025',
  })
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
  
  const [addFormData, setAddFormData] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    feeType: 'TUITION',
    description: '',
    academicYear: '2024-2025',
  })
  
  const [markPaidFormData, setMarkPaidFormData] = useState({
    status: 'PAID',
    amountPaid: '',
    paymentMode: 'CASH',
    remarks: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchInitialData()
      fetchFees()
      fetchStats()
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchFees()
    }
  }, [filters, currentPage])

  const fetchInitialData = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      
      // Fetch batches for HOD's department
      const batchRes = await fetch('/api/admin/batches', { headers })
      if (batchRes.ok) {
        const batchData = await batchRes.json()
        // Filter batches for HOD's department
        const deptBatches = batchData.filter((b: { department?: { id: string } }) => b.department?.id === user?.departmentId)
        setBatches(deptBatches)
      }
      
      // Fetch students for HOD's department
      const studentRes = await fetch('/api/admin/users?role=STUDENT', { headers })
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        const deptStudents = studentData.filter((s: { departmentId?: string }) => s.departmentId === user?.departmentId)
        setStudents(deptStudents)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchFees = async () => {
    try {
      setLoadingData(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', '50')
      
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.feeType) queryParams.append('feeType', filters.feeType)
      if (filters.batchId) queryParams.append('batchId', filters.batchId)
      if (filters.academicYear) queryParams.append('academicYear', filters.academicYear)
      
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/fees?${queryParams}`, {
        headers,
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

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/fees/stats?academicYear=${filters.academicYear}`, {
        headers,
      })
      
      if (res.ok) {
        const data = await res.json()
        setStats(data.overview)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleAddFee = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/fees', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...addFormData,
          amount: parseFloat(addFormData.amount),
        }),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setAddFormData({
          studentId: '',
          amount: '',
          dueDate: '',
          feeType: 'TUITION',
          description: '',
          academicYear: '2024-2025',
        })
        fetchFees()
        fetchStats()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add fee')
      }
    } catch (error) {
      console.error('Error adding fee:', error)
      alert('Failed to add fee')
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedFee) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/fees/${selectedFee.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...markPaidFormData,
          amountPaid: markPaidFormData.amountPaid ? parseFloat(markPaidFormData.amountPaid) : undefined,
        }),
      })
      
      if (res.ok) {
        setShowMarkPaidDialog(false)
        setSelectedFee(null)
        fetchFees()
        fetchStats()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to mark fee as paid')
      }
    } catch (error) {
      console.error('Error marking fee as paid:', error)
      alert('Failed to mark fee as paid')
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

  if (loading || user?.role !== 'HOD') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Department Fees</h1>
            <p className="text-white/50 mt-1">Manage fees for {user.department?.name || 'your department'}</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Fee
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Total Fees</p>
                    <p className="text-2xl font-bold text-white">₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Collected</p>
                    <p className="text-2xl font-bold text-green-500">₹{stats.collectedAmount.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-2">{stats.collectionRate}% collection rate</p>
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
                    <BarChart3 className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Overdue</p>
                    <p className="text-2xl font-bold text-red-500">{stats.overdueFees}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                value={filters.feeType || 'ALL'}
                onValueChange={(value) => setFilters({ ...filters, feeType: value === 'ALL' ? '' : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Fee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="TUITION">Tuition</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="LIBRARY">Library</SelectItem>
                  <SelectItem value="HOSTEL">Hostel</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.batchId || 'ALL'}
                onValueChange={(value) => setFilters({ ...filters, batchId: value === 'ALL' ? '' : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                  ))}
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
            <CardTitle className="text-white">Fee Records</CardTitle>
            <CardDescription className="text-white/50">
              Showing {fees.length} fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No fee records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Due Date</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{fee.student.fullName}</p>
                            <p className="text-white/50 text-sm">{fee.student.studentId}</p>
                            {fee.student.enrollments[0] && (
                              <p className="text-white/30 text-xs">
                                {fee.student.enrollments[0].batch.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white/70">{fee.feeType.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">₹{fee.amount.toLocaleString()}</p>
                            {fee.status === 'PARTIALLY_PAID' && fee.amountPaid && (
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
                        <td className="py-3 px-4">
                          {fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFee(fee)
                                setMarkPaidFormData({
                                  status: 'PAID',
                                  amountPaid: fee.amount.toString(),
                                  paymentMode: 'CASH',
                                  remarks: '',
                                })
                                setShowMarkPaidDialog(true)
                              }}
                              className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark
                            </Button>
                          )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-white/10 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-white/10 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Fee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Fee</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new fee record for a department student
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select
                value={addFormData.studentId}
                onValueChange={(value) => setAddFormData({ ...addFormData, studentId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                value={addFormData.amount}
                onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })}
                placeholder="Enter amount"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={addFormData.dueDate}
                onChange={(e) => setAddFormData({ ...addFormData, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Fee Type *</Label>
              <Select
                value={addFormData.feeType}
                onValueChange={(value) => setAddFormData({ ...addFormData, feeType: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUITION">Tuition</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="LIBRARY">Library</SelectItem>
                  <SelectItem value="HOSTEL">Hostel</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-white/10 text-white">
              Cancel
            </Button>
            <Button
              onClick={handleAddFee}
              disabled={!addFormData.studentId || !addFormData.amount || !addFormData.dueDate}
              className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
            >
              Add Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Mark Fee as Paid</DialogTitle>
            <DialogDescription className="text-white/50">
              Update payment status for {selectedFee?.student.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={markPaidFormData.status}
                onValueChange={(value: any) => setMarkPaidFormData({ ...markPaidFormData, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="WAIVED">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {markPaidFormData.status === 'PARTIALLY_PAID' && (
              <div className="space-y-2">
                <Label>Amount Paid (₹) *</Label>
                <Input
                  type="number"
                  value={markPaidFormData.amountPaid}
                  onChange={(e) => setMarkPaidFormData({ ...markPaidFormData, amountPaid: e.target.value })}
                  placeholder="Enter amount paid"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}
            
            {markPaidFormData.status !== 'WAIVED' && (
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={markPaidFormData.paymentMode}
                  onValueChange={(value) => setMarkPaidFormData({ ...markPaidFormData, paymentMode: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={markPaidFormData.remarks}
                onChange={(e) => setMarkPaidFormData({ ...markPaidFormData, remarks: e.target.value })}
                placeholder="Optional remarks"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)} className="border-white/10 text-white">
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={markPaidFormData.status === 'PARTIALLY_PAID' && !markPaidFormData.amountPaid}
              className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
