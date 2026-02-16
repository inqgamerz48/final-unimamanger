'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Users, GraduationCap, Upload, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

interface SetupStep {
  id: number
  title: string
  description: string
  icon: any
}

const steps: SetupStep[] = [
  { id: 1, title: 'College Details', description: 'Enter your institution information', icon: Building2 },
  { id: 2, title: 'Department', description: 'Create your first department', icon: Building2 },
  { id: 3, title: 'Staff', description: 'Add HOD and Faculty', icon: Users },
  { id: 4, title: 'Students', description: 'Import student data', icon: GraduationCap },
]

export default function SetupWizard() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: College Details
  const [collegeData, setCollegeData] = useState({
    collegeName: '',
    collegeCode: '',
    address: '',
    phone: '',
    email: '',
    academicYear: '2024-2025',
    logoUrl: '',
  })

  // Step 2: Department
  const [departmentData, setDepartmentData] = useState({
    name: '',
    code: '',
  })
  const [departmentId, setDepartmentId] = useState('')

  // Step 3: Staff
  const [hodData, setHodData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [facultyData, setFacultyData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Step 1: Save College
  const handleSaveCollege = async () => {
    setIsSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/setup/college', {
        method: 'POST',
        headers,
        body: JSON.stringify(collegeData),
      })

      if (res.ok) {
        handleNext()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save college details')
      }
    } catch (error) {
      console.error('Error saving college:', error)
      alert('Failed to save college details')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Save Department
  const handleSaveDepartment = async () => {
    setIsSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/setup/department', {
        method: 'POST',
        headers,
        body: JSON.stringify(departmentData),
      })

      if (res.ok) {
        const data = await res.json()
        setDepartmentId(data.id)
        handleNext()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Failed to create department')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 3: Save Staff
  const handleSaveStaff = async () => {
    if (hodData.password !== hodData.confirmPassword) {
      alert('HOD passwords do not match')
      return
    }
    if (facultyData.password !== facultyData.confirmPassword) {
      alert('Faculty passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      // Create HOD
      const headers = await getAuthHeaders(firebaseUser)
      const hodRes = await fetch('/api/admin/setup/hod', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...hodData, departmentId }),
      })

      if (!hodRes.ok) {
        const error = await hodRes.json()
        alert(error.error || 'Failed to create HOD')
        setIsSubmitting(false)
        return
      }

      // Create Faculty
      const facultyRes = await fetch('/api/admin/setup/faculty', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...facultyData, departmentId }),
      })

      if (!facultyRes.ok) {
        const error = await facultyRes.json()
        alert(error.error || 'Failed to create Faculty')
        setIsSubmitting(false)
        return
      }

      handleNext()
    } catch (error) {
      console.error('Error creating staff:', error)
      alert('Failed to create staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 4: Complete Setup
  const handleCompleteSetup = async () => {
    setIsSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/setup/complete', {
        method: 'POST',
        headers,
      })

      if (res.ok) {
        alert('Setup completed successfully! Redirecting to dashboard...')
        router.push('/admin/dashboard')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to complete setup')
      }
    } catch (error) {
      console.error('Error completing setup:', error)
      alert('Failed to complete setup')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const CurrentStepIcon = steps[currentStep - 1].icon

  return (
    <div className="min-h-screen bg-obsidian py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to UNI Manager</h1>
          <p className="text-white/50">Let's set up your institution</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      isCompleted
                        ? 'bg-neon-lime border-neon-lime text-obsidian'
                        : isCurrent
                        ? 'border-neon-lime text-neon-lime'
                        : 'border-white/20 text-white/40'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-full h-1 mx-2 ${
                        isCompleted ? 'bg-neon-lime' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <p className={`text-sm font-medium ${
                  currentStep === step.id ? 'text-neon-lime' : 'text-white/50'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                <CurrentStepIcon className="w-5 h-5 text-neon-lime" />
              </div>
              <div>
                <CardTitle className="text-white">{steps[currentStep - 1].title}</CardTitle>
                <CardDescription className="text-white/50">
                  {steps[currentStep - 1].description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: College Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">College Name *</Label>
                    <Input
                      value={collegeData.collegeName}
                      onChange={(e) => setCollegeData({ ...collegeData, collegeName: e.target.value })}
                      placeholder="e.g., ABC Engineering College"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">College Code *</Label>
                    <Input
                      value={collegeData.collegeCode}
                      onChange={(e) => setCollegeData({ ...collegeData, collegeCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., ABC"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Academic Year *</Label>
                    <Select
                      value={collegeData.academicYear}
                      onValueChange={(value) => setCollegeData({ ...collegeData, academicYear: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2026-2027">2026-2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Phone</Label>
                    <Input
                      value={collegeData.phone}
                      onChange={(e) => setCollegeData({ ...collegeData, phone: e.target.value })}
                      placeholder="+91..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Email</Label>
                    <Input
                      type="email"
                      value={collegeData.email}
                      onChange={(e) => setCollegeData({ ...collegeData, email: e.target.value })}
                      placeholder="college@example.com"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Address</Label>
                    <Input
                      value={collegeData.address}
                      onChange={(e) => setCollegeData({ ...collegeData, address: e.target.value })}
                      placeholder="College address..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveCollege}
                    disabled={!collegeData.collegeName || !collegeData.collegeCode || isSubmitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {isSubmitting ? 'Saving...' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Department */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Department Name *</Label>
                    <Input
                      value={departmentData.name}
                      onChange={(e) => setDepartmentData({ ...departmentData, name: e.target.value })}
                      placeholder="e.g., Computer Science"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Department Code *</Label>
                    <Input
                      value={departmentData.code}
                      onChange={(e) => setDepartmentData({ ...departmentData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., CSE"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="border-white/10 text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleSaveDepartment}
                    disabled={!departmentData.name || !departmentData.code || isSubmitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {isSubmitting ? 'Creating...' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Staff */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* HOD Section */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-neon-lime" />
                    Head of Department (HOD)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Full Name *</Label>
                      <Input
                        value={hodData.fullName}
                        onChange={(e) => setHodData({ ...hodData, fullName: e.target.value })}
                        placeholder="e.g., Dr. John Smith"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Email *</Label>
                      <Input
                        type="email"
                        value={hodData.email}
                        onChange={(e) => setHodData({ ...hodData, email: e.target.value })}
                        placeholder="hod@example.com"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Phone</Label>
                      <Input
                        value={hodData.phone}
                        onChange={(e) => setHodData({ ...hodData, phone: e.target.value })}
                        placeholder="+91..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Password *</Label>
                      <Input
                        type="password"
                        value={hodData.password}
                        onChange={(e) => setHodData({ ...hodData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Confirm Password *</Label>
                      <Input
                        type="password"
                        value={hodData.confirmPassword}
                        onChange={(e) => setHodData({ ...hodData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Faculty Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-lime" />
                    Faculty Member
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Full Name *</Label>
                      <Input
                        value={facultyData.fullName}
                        onChange={(e) => setFacultyData({ ...facultyData, fullName: e.target.value })}
                        placeholder="e.g., Prof. Jane Doe"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Email *</Label>
                      <Input
                        type="email"
                        value={facultyData.email}
                        onChange={(e) => setFacultyData({ ...facultyData, email: e.target.value })}
                        placeholder="faculty@example.com"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Phone</Label>
                      <Input
                        value={facultyData.phone}
                        onChange={(e) => setFacultyData({ ...facultyData, phone: e.target.value })}
                        placeholder="+91..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Password *</Label>
                      <Input
                        type="password"
                        value={facultyData.password}
                        onChange={(e) => setFacultyData({ ...facultyData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Confirm Password *</Label>
                      <Input
                        type="password"
                        value={facultyData.confirmPassword}
                        onChange={(e) => setFacultyData({ ...facultyData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="border-white/10 text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleSaveStaff}
                    disabled={
                      !hodData.fullName || !hodData.email || !hodData.password ||
                      !facultyData.fullName || !facultyData.email || !facultyData.password ||
                      isSubmitting
                    }
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {isSubmitting ? 'Creating...' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Students */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-neon-lime/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-neon-lime" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Almost Done!</h3>
                  <p className="text-white/50 mb-6">
                    You've successfully configured your college. You can now import students from the dashboard
                    or continue to start using the system.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 text-left max-w-md mx-auto">
                    <h4 className="text-white font-medium mb-2">What's Next?</h4>
                    <ul className="text-white/50 text-sm space-y-1">
                      <li>• Import students using Excel/CSV</li>
                      <li>• Create batches and subjects</li>
                      <li>• Manage fee collection</li>
                      <li>• Generate reports</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="border-white/10 text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleCompleteSetup}
                    disabled={isSubmitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {isSubmitting ? 'Completing...' : 'Complete Setup'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
