'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthSelectorProps {
  selectedMonth: string // Format: YYYY-MM-01
}

export default function MonthSelector({ selectedMonth }: MonthSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse current month
  const [year, month] = selectedMonth.split('-').map(Number)
  const displayDate = new Date(year, month - 1, 1)

  // Format for display
  const monthName = displayDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  // Check if this is the current month
  const today = new Date()
  const isCurrentMonth = 
    year === today.getFullYear() && 
    month === today.getMonth() + 1

  const navigateToMonth = (newYear: number, newMonth: number) => {
    // Format as YYYY-MM-01
    const monthStr = `${newYear}-${String(newMonth).padStart(2, '0')}-01`
    
    // Create new URL with month param
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', monthStr)
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const goToPreviousMonth = () => {
    if (month === 1) {
      navigateToMonth(year - 1, 12)
    } else {
      navigateToMonth(year, month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      navigateToMonth(year + 1, 1)
    } else {
      navigateToMonth(year, month + 1)
    }
  }

  const goToCurrentMonth = () => {
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    navigateToMonth(currentYear, currentMonth)
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-200 dark:border-gray-700">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToPreviousMonth}
        className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {monthName}
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isCurrentMonth && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToCurrentMonth}
          className="h-7 text-xs px-2 border-gray-300 dark:border-gray-600"
        >
          Today
        </Button>
      )}
    </div>
  )
}
