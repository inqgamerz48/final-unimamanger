'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'react-hot-toast'

interface ExcelImportProps {
    onImport: (data: any[]) => Promise<void>
    templateUrl?: string
    expectedColumns?: string[]
}

export function ExcelImport({ onImport, templateUrl, expectedColumns }: ExcelImportProps) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<any[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet)

                if (expectedColumns) {
                    // Basic validation
                    const fileColumns = Object.keys(jsonData[0] || {})
                    const missing = expectedColumns.filter(col => !fileColumns.includes(col))
                    if (missing.length > 0) {
                        toast.error(`Missing columns: ${missing.join(', ')}`)
                        setFile(null)
                        setPreview([])
                        return
                    }
                }

                setPreview(jsonData.slice(0, 5)) // Preview first 5 rows
            } catch (error) {
                console.error('Parse error:', error)
                toast.error('Failed to parse Excel file')
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        if (!file) return

        setLoading(true)
        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet)

                await onImport(jsonData)
                setFile(null)
                setPreview([])

                // Reset input
                const input = document.getElementById('excel-upload') as HTMLInputElement
                if (input) input.value = ''

            } catch (error) {
                console.error('Import error:', error)
                toast.error('Failed to import data')
            } finally {
                setLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:bg-white/5 transition-colors">
                <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Label htmlFor="excel-upload" className="cursor-pointer block">
                    <FileSpreadsheet className="w-10 h-10 text-neon-lime mx-auto mb-2" />
                    <span className="text-white font-medium block">
                        {file ? file.name : 'Click to select Excel file'}
                    </span>
                    <span className="text-white/50 text-sm block mt-1">
                        Supported formats: .xlsx, .xls
                    </span>
                </Label>
            </div>

            {preview.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/70">Preview (First 5 rows)</h4>
                    <div className="bg-charcoal border border-white/5 rounded-md overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-white/50 bg-white/5 uppercase">
                                <tr>
                                    {Object.keys(preview[0]).map(key => (
                                        <th key={key} className="px-3 py-2">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-white/70">
                                {preview.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val: any, j) => (
                                            <td key={j} className="px-3 py-2 whitespace-nowrap">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {file && (
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setFile(null); setPreview([]) }}>Cancel</Button>
                    <Button onClick={handleImport} disabled={loading} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Import {preview.length > 0 ? 'Data' : ''}
                    </Button>
                </div>
            )}
        </div>
    )
}
