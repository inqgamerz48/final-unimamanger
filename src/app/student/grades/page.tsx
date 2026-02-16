'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookOpen, Calculator } from 'lucide-react'

interface Grade {
  id: string
  examType: 'MST1' | 'MST2' | 'FINAL'
  marks: number
  totalMarks: number
  subject: {
    name: string
    code: string
    credits: number
    type: string
  }
}

interface SubjectGrades {
  subjectName: string
  subjectCode: string
  credits: number
  type: string
  grades: {
    examType: string
    marks: number
    totalMarks: number
  }[]
}

export default function StudentGradesPage() {
  const [loading, setLoading] = useState(true)
  const [groupedGrades, setGroupedGrades] = useState<SubjectGrades[]>([])

  useEffect(() => {
    fetch('/api/student/grades')
      .then(res => res.json())
      .then((data: Grade[]) => {
        // Group by subject
        const groups: Record<string, SubjectGrades> = {}

        data.forEach(g => {
          const key = g.subject.code
          if (!groups[key]) {
            groups[key] = {
              subjectName: g.subject.name,
              subjectCode: g.subject.code,
              credits: g.subject.credits,
              type: g.subject.type,
              grades: []
            }
          }
          groups[key].grades.push({
            examType: g.examType,
            marks: g.marks,
            totalMarks: g.totalMarks
          })
        })

        setGroupedGrades(Object.values(groups))
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const getExamBadge = (type: string) => {
    switch (type) {
      case 'MST1': return <Badge variant="secondary">MST 1</Badge>
      case 'MST2': return <Badge variant="secondary">MST 2</Badge>
      case 'FINAL': return <Badge className="bg-neon-lime text-obsidian">Final</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Grades</h1>
          <p className="text-white/50 mt-1">Academic performance and assessment results</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
          </div>
        ) : groupedGrades.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl text-white font-medium">No grades available</h3>
            <p className="text-white/50">Grades will appear here once faculty uploads them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedGrades.map(subject => (
              <Card key={subject.subjectCode} className="bg-charcoal border-white/5 hover:border-neon-lime/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">{subject.subjectName}</h3>
                      <p className="text-neon-lime font-mono text-xs">{subject.subjectCode}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {subject.credits} Credits
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {subject.grades.length > 0 ? (
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-white/5">
                          {subject.grades.map((g, i) => (
                            <tr key={i}>
                              <td className="py-2">{getExamBadge(g.examType)}</td>
                              <td className="py-2 text-right">
                                <span className="text-white font-bold">{g.marks}</span>
                                <span className="text-white/40"> / {g.totalMarks}</span>
                              </td>
                            </tr>
                          ))}
                          {/* Calculate Total if needed, simplistic sum for now */}
                          <tr className="border-t border-white/10">
                            <td className="py-2 font-medium text-white/70">Total</td>
                            <td className="py-2 text-right">
                              <span className="text-neon-lime font-bold">
                                {subject.grades.reduce((sum, g) => sum + g.marks, 0)}
                              </span>
                              <span className="text-white/40"> / {subject.grades.reduce((sum, g) => sum + g.totalMarks, 0)}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-white/40 italic">No exams recorded yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
