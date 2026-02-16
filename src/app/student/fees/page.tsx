"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Fee {
  id: string
  amount: number
  dueDate: string
  status: string
  paidAt: string | null
  description: string | null
  academicYear: string
}

export default function StudentFees() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [fees, setFees] = useState<Fee[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchFees()
    }
  }, [user])

  const fetchFees = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/student/fees', { headers })
      if (res.ok) {
        const data = await res.json()
        setFees(data)
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handlePay = async (feeId: string) => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/student/fees/${feeId}/pay`, {
        method: 'POST',
        headers,
      })
      if (res.ok) {
        fetchFees()
      }
    } catch (error) {
      console.error('Error paying fee:', error)
    }
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const pendingFees = fees.filter(f => f.status === 'PENDING')
  const paidFees = fees.filter(f => f.status === 'PAID')
  const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Fees</h1>
          <p className="text-white/50 mt-1">View and pay your fees</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Total Due</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">₹{totalDue.toLocaleString()}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Pending</p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{pendingFees.length}</p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Paid</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">₹{paidFees.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fees List */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Fee Details</CardTitle>
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
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Description</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Academic Year</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Due Date</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{fee.description || 'Tuition Fee'}</td>
                        <td className="py-3 px-4 text-white/70">{fee.academicYear}</td>
                        <td className="py-3 px-4 text-white font-medium">₹{fee.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-white">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4">
                          {fee.status === 'PAID' ? (
                            <Badge variant="success">Paid</Badge>
                          ) : fee.status === 'OVERDUE' ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {fee.status === 'PENDING' && (
                            <Button
                              onClick={() => handlePay(fee.id)}
                              size="sm"
                              className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                            >
                              Pay Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
