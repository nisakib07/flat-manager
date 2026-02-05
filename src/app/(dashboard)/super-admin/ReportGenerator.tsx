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
import { useReactToPrint } from 'react-to-print'
import { MonthlyReport } from './MonthlyReport'
import { getMonthlyReportData } from './actions'
import { FileText, Loader2 } from 'lucide-react'
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
    // Set to first day of next month to include current month fully? 
    // Actually today is fine, loop until current date
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1)

    let d = new Date(startDate)
    while (d <= currentDate) {
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      months.push({ value: monthStr, label })
      d.setMonth(d.getMonth() + 1)
    }
    // Sort descending (newest first)
    return months.reverse()
  }, [])

  const selectedMonthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || initialMonthLabel

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Meal_Report_${selectedMonthLabel.replace(/\s/g, '_')}`,
  })

  async function generateAndPrint() {
    try {
      setLoading(true)
      // Fetch data for SELECTED month
      const data = await getMonthlyReportData(selectedMonth)
      setReportData(data)
      
      // Wait for state update and render, then print
      setTimeout(() => {
        handlePrint()
        setLoading(false)
      }, 500)
    } catch (error: any) {
      console.error(error)
      toast.error('Failed to generate report: ' + error.message)
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
        onClick={generateAndPrint} 
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
        {loading ? 'Preparing PDF...' : 'Generate PDF Report'}
      </Button>

      {/* Hidden Report */}
      <div style={{ display: 'none' }}>
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
