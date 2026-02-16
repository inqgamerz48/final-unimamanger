'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowRight, GraduationCap } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Batch {
    id: string
    name: string
    year: number
    semester: number
    department: { name: string }
}

export default function BatchPromotionPage() {
    const [batches, setBatches] = useState<Batch[]>([])
    const [selectedBatch, setSelectedBatch] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [promoting, setPromoting] = useState(false)

    useEffect(() => {
        fetch('/api/admin/batches') // Assuming this exists or create it
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBatches(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const handlePromote = async () => {
        if (!selectedBatch) return

        const batch = batches.find(b => b.id === selectedBatch)
        if (!batch) return

        if (!confirm(`Are you sure you want to promote ${batch.name} to Semester ${batch.semester + 1}?`)) return

        setPromoting(true)
        try {
            const res = await fetch('/api/admin/batches/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchId: selectedBatch,
                    operation: 'PROMOTE_TO_NEXT_SEM'
                })
            })

            if (res.ok) {
                toast.success('Batch promoted successfully')
                // Refresh data
                const updatedBatches = batches.map(b =>
                    b.id === selectedBatch ? { ...b, semester: b.semester + 1 } : b
                )
                setBatches(updatedBatches)
                setSelectedBatch('')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Promotion failed')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to promote batch')
        } finally {
            setPromoting(false)
        }
    }

    const getSelectedBatchDetails = () => batches.find(b => b.id === selectedBatch)

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-white">Batch Promotion</h1>
                    <p className="text-white/50 mt-1">Move students to next semester or graduate them.</p>
                </div>

                <Card className="bg-charcoal border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Select Batch</CardTitle>
                        <CardDescription className="text-white/50">Choose a batch to promote to the next semester.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-white/70">Source Batch</Label>
                            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select a batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map(batch => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            {batch.name} - {batch.department.name} (Sem {batch.semester})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBatch && (
                            <div className="p-4 border border-white/10 rounded-lg bg-white/5 flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <p className="text-sm text-white/50 uppercase">Current</p>
                                    <p className="text-2xl font-bold text-white">Semester {getSelectedBatchDetails()?.semester}</p>
                                </div>
                                <ArrowRight className="w-6 h-6 text-neon-lime" />
                                <div className="text-center flex-1">
                                    <p className="text-sm text-white/50 uppercase">Next</p>
                                    <p className="text-2xl font-bold text-neon-lime">Semester {(getSelectedBatchDetails()?.semester || 0) + 1}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handlePromote}
                                disabled={!selectedBatch || promoting}
                                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                            >
                                {promoting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Promote to Next Semester
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
