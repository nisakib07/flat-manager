'use client'

import { useState, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MonthlyReport } from './MonthlyReport'
import { getMonthlyReportData } from './actions'
import { FileText, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function ReportGenerator({ month: initialMonth, monthLabel: initialMonthLabel }: { month: string, monthLabel: string }) {
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [reportData, setReportData] = useState<any>(null)
  
  // Ref for the printable component
  const componentRef = useRef<HTMLDivElement>(null)

  // Generate list of months from Feb 2026 to Current Month
  const availableMonths = useMemo(() => {
    const months = []
    const startDate = new Date(2026, 1, 1) // Feb 2026
    const today = new Date()
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1)

    let d = new Date(startDate)
    while (d <= currentDate) {
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      months.push({ value: monthStr, label })
      d.setMonth(d.getMonth() + 1)
    }
    return months.reverse()
  }, [])

  const selectedMonthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || initialMonthLabel


  async function generateAndDownload() {
    try {
      setLoading(true)
      // 1. Fetch data
      const data = await getMonthlyReportData(selectedMonth)
      setReportData(data)
      
      // 2. Wait for rendering
      setTimeout(async () => {
        try {
            const element = componentRef.current
            if (!element) {
              toast.error("Error: Report element not found!")
              setLoading(false)
              return
            }

            // 3. Import html2pdf dynamically
            
            const html2pdfModule = await import('html2pdf.js')
            const html2pdf = html2pdfModule.default as any
            
            console.log("html2pdf loaded:", html2pdf)

            const opt = {
              margin:       0,
              filename:     `Banasree_Report_${selectedMonthLabel.replace(/ /g, '_')}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                logging: false, // Disable logging to reduce noise
                backgroundColor: '#ffffff', // Force white background to avoid transparency issues
                onclone: (clonedDoc: any) => {
                    // Force white background on body and generic font to avoid complex CSS var issues
                    clonedDoc.body.style.backgroundColor = '#ffffff';
                    clonedDoc.body.style.color = '#000000';
                } 
              }, 
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // 4. Generate PDF
            console.log("Starting .save()...")
            
            await html2pdf().set(opt).from(element).save()
            
            console.log("PDF Saved.")
            setLoading(false)
            toast.success("PDF Downloaded successfully!")
        } catch (innerError: any) {
            console.error("Inner Error:", innerError)
            toast.error("Error: " + innerError.message) // Simplified error message
            setLoading(false)
        }
      }, 1500)

    } catch (error: any) {
      console.error(error)
      toast.error('Failed to fetch data: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Month</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       <Button 
        onClick={generateAndDownload} 
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
        {loading ? 'Generating PDF...' : 'Download Report'}
      </Button>

      {/* Hidden Report Container */}
      {/* Must be visible to DOM for html2canvas to work, so we move it off-screen */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', width: '794px' }}>
        {reportData && (
          <MonthlyReport 
            ref={componentRef} 
            monthLabel={selectedMonthLabel} 
            data={reportData} 
          />
        )}
      </div>
    </div>
  )
}
