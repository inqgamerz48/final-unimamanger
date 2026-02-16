'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExcelImport } from '@/components/admin/excel-import'
import { toast } from 'react-hot-toast'
import { Download, ChevronLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function BulkImportPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [defaultPassword, setDefaultPassword] = useState('welcome123')
    const [results, setResults] = useState<any>(null)

    const downloadTemplate = (type: 'student' | 'faculty') => {
        const headers = type === 'student'
            ? ['fullName', 'email', 'phone', 'studentId', 'department', 'batch', 'role']
            : ['fullName', 'email', 'phone', 'department', 'role']

        const sample = type === 'student'
            ? [{ fullName: 'John Doe', email: 'john@example.com', phone: '1234567890', studentId: '24CSE001', department: 'Computer Science', batch: '2024-2028', role: 'STUDENT' }]
            : [{ fullName: 'Dr. Jane Teacher', email: 'jane@example.com', phone: '9876543210', department: 'Computer Science', role: 'FACULTY' }]

        const ws = XLSX.utils.json_to_sheet(sample, { header: headers })
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, `${type}_import_template.xlsx`)
    }

    const handleImport = async (data: any[]) => {
        setLoading(true)
        setResults(null)
        try {
            const res = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    users: data,
                    defaultPassword
                })
            })

            const result = await res.json()
            if (res.ok) {
                setResults(result)
                if (result.failed === 0) {
                    toast.success(`Successfully imported ${result.success} users`)
                } else {
                    toast('Import completed with some errors', { icon: '⚠️' })
                }
            } else {
                toast.error(result.error || 'Import failed')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to import users')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Bulk User Import</h1>
                        <p className="text-white/50">Create multiple users at once via Excel</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="bg-charcoal border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Import Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Default Password</Label>
                                    <Input
                                        value={defaultPassword}
                                        onChange={(e) => setDefaultPassword(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <p className="text-xs text-white/40">This password will be set for all new users.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-charcoal border-white/5">
                            <CardContent className="p-6">
                                <Tabs defaultValue="student">
                                    <TabsList className="bg-white/5 border-white/5 w-full">
                                        <TabsTrigger value="student" className="flex-1">Students</TabsTrigger>
                                        <TabsTrigger value="faculty" className="flex-1">Faculty</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="student" className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium">Student Import</h3>
                                            <Button variant="outline" size="sm" onClick={() => downloadTemplate('student')} className="border-neon-lime/20 text-neon-lime hover:bg-neon-lime/10">
                                                <Download className="w-4 h-4 mr-2" /> Download Template
                                            </Button>
                                        </div>
                                        <ExcelImport
                                            onImport={handleImport}
                                            expectedColumns={['email', 'fullName', 'department']}
                                        />
                                    </TabsContent>
                                    <TabsContent value="faculty" className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium">Faculty Import</h3>
                                            <Button variant="outline" size="sm" onClick={() => downloadTemplate('faculty')} className="border-neon-lime/20 text-neon-lime hover:bg-neon-lime/10">
                                                <Download className="w-4 h-4 mr-2" /> Download Template
                                            </Button>
                                        </div>
                                        <ExcelImport
                                            onImport={handleImport}
                                            expectedColumns={['email', 'fullName', 'department']}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <Card className="bg-charcoal border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-white/70">
                                <p>1. Download the appropriate template.</p>
                                <p>2. Fill in the user details. Emails must be unique.</p>
                                <p>3. <b>Roles:</b> STUDENT, FACULTY, HOD</p>
                                <p>4. <b>Department:</b> Must match existing department names exactly.</p>
                                <p>5. <b>Batch:</b> (For Students) Must match existing batch names.</p>
                            </CardContent>
                        </Card>

                        {results && (
                            <Card className={`border-l-4 ${results.failed === 0 ? 'border-l-green-500' : 'border-l-yellow-500'} bg-charcoal border-t-0 border-r-0 border-b-0`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white text-lg flex items-center gap-2">
                                        {results.failed === 0 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                        Import Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-green-500 font-medium">Successful: {results.success}</p>
                                        <p className="text-red-500 font-medium">Failed: {results.failed}</p>
                                        {results.errors.length > 0 && (
                                            <div className="mt-4 p-3 bg-red-500/10 rounded-md max-h-40 overflow-y-auto text-xs text-red-200">
                                                <p className="font-bold mb-1">Errors:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {results.errors.map((err: string, i: number) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
