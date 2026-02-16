export interface StudentRecord {
  id?: string
  name: string
  email?: string
  rollNumber?: string
  department?: string
  batch?: string
  year?: number
}

export interface GradeRecord {
  id: string
  studentName: string
  studentRoll?: string
  subject?: string
  grade?: string
  marks?: number
  semester?: string
}

export interface FeeRecord {
  id: string
  studentName: string
  studentRoll?: string
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  dueDate?: string
  paidDate?: string
}

async function getPdfLibs() {
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.default
  return { jsPDF }
}

export async function generateStudentListPDF(students: StudentRecord[], title: string = 'Student List') {
  const { jsPDF } = await getPdfLibs()
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  if (students.length === 0) {
    doc.text('No data available', 14, 40)
    return doc
  }

  const tableData = students.map(s => [
    s.name || '-',
    s.email || '-',
    s.rollNumber || '-',
    s.department || '-',
    s.batch || '-'
  ])

    ; (doc as any).autoTable({
      head: [['Name', 'Email', 'Roll No', 'Department', 'Batch']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [76, 175, 80] }
    })

  return doc
}

export async function generateGradesPDF(grades: GradeRecord[], title: string = 'Grades Report') {
  const { jsPDF } = await getPdfLibs()
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  if (grades.length === 0) {
    doc.text('No data available', 14, 40)
    return doc
  }

  const tableData = grades.map(g => [
    g.studentName || '-',
    g.studentRoll || '-',
    g.subject || '-',
    g.grade || '-',
    g.marks?.toString() || '-',
    g.semester || '-'
  ])

    ; (doc as any).autoTable({
      head: [['Student', 'Roll No', 'Subject', 'Grade', 'Marks', 'Semester']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243] }
    })

  return doc
}

export async function generateFeeReportPDF(fees: FeeRecord[], title: string = 'Fee Report') {
  const { jsPDF } = await getPdfLibs()
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  if (fees.length === 0) {
    doc.text('No data available', 14, 40)
    return doc
  }

  const tableData = fees.map(f => [
    f.studentName || '-',
    f.studentRoll || '-',
    `$${(f.amount || 0).toFixed(2)}`,
    f.status || 'PENDING',
    f.dueDate || '-',
    f.paidDate || '-'
  ])

    ; (doc as any).autoTable({
      head: [['Student', 'Roll No', 'Amount', 'Status', 'Due Date', 'Paid Date']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 152, 0] }
    })

  return doc
}

export async function downloadPDF(doc: any, filename: string) {
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export async function generateAttendancePDF(
  records: any[],
  title: string = 'Attendance Report',
  dateRange?: string
) {
  const { jsPDF } = await getPdfLibs()
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  let yPos = 30
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos)

  if (dateRange) {
    yPos += 6
    doc.text(`Period: ${dateRange}`, 14, yPos)
  }

  if (records.length === 0) {
    doc.text('No data available', 14, yPos + 10)
    return doc
  }

  const tableData = records.map(r => [
    r.studentName || '-',
    r.studentRoll || '-',
    r.subject || '-',
    r.totalClasses?.toString() || '0',
    r.present?.toString() || '0',
    r.absent?.toString() || '0',
    `${r.percentage?.toFixed(1) || 0}%`
  ])

    ; (doc as any).autoTable({
      head: [['Student', 'Roll No', 'Subject', 'Total', 'Present', 'Absent', 'Percentage']],
      body: tableData,
      startY: yPos + 6,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [156, 39, 176] }
    })

  return doc
}
