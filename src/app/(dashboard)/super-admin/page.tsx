import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { closeMonth, openMonth } from './actions'
import ReportGenerator from './ReportGenerator'

// Helper component for the close button
function MonthStatusAction({ month, isClosed, monthLabel }: { month: string, isClosed: boolean, monthLabel: string }) {
  const bindedClose = closeMonth.bind(null, month);
  const bindedOpen = openMonth.bind(null, month);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div>
        <h3 className="font-semibold">{monthLabel}</h3>
        <p className="text-sm text-muted-foreground">
          Status: <span className={isClosed ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
            {isClosed ? 'CLOSED' : 'OPEN'}
          </span>
        </p>
      </div>
      
      <form action={async () => {
        'use server'
        if (isClosed) await bindedOpen()
        else await bindedClose()
      }}>
        <Button 
            variant={isClosed ? "outline" : "destructive"}
            type="submit"
        >
          {isClosed ? 'Re-open Month' : `Close ${monthLabel}`}
        </Button>
      </form>
    </div>
  )
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUser?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Calculate previous month
  const today = new Date()
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1) // 1st of current month
  
  // Previous Month
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
  const prevMonthLabel = prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Current Month String for comparison/info
  const currentMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`
  const currentMonthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })


  // Fetch status
  const { data: monthStatuses } = await supabase
    .from('month_status')
    .select('*')
    .in('month', [prevMonthStr, currentMonthStr])

  const prevMonthStatus = monthStatuses?.find(s => s.month === prevMonthStr)
  const isPrevClosed = prevMonthStatus?.is_closed || false

  // Fetch some summary stats for the previous month to help decision
  const { data: prevMeals } = await supabase
    .from('daily_meals')
    .select('count')
    .eq('meal_date', `${prevMonthStr}-01`) // Just a rough check, or fetch count
    // Actually better to get a rough count of meals in that month
    .gte('meal_date', `${prevMonthStr}-01`)
    .lt('meal_date', `${currentMonthStr}-01`)

    // Simple robust query for existence
  
  return (
    <div className="space-y-6 pb-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Super Admin Controls 🛡️
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system-wide settings, close months, and oversee finances.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Month Management</CardTitle>
            <CardDescription>Lock past months to prevent further editing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Previous Month Action */}
            {prevMonthStr >= '2026-02' ? (
              <MonthStatusAction 
                month={prevMonthStr} 
                isClosed={isPrevClosed} 
                monthLabel={prevMonthLabel} 
              />
            ) : (
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="font-semibold text-muted-foreground">{prevMonthLabel}</h3>
                 <p className="text-sm text-muted-foreground">
                    Cannot close months before Project Start (Feb 2026).
                </p>
              </div>
            )}

             {/* Info about current month */}
             <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="font-semibold text-muted-foreground">{currentMonthLabel}</h3>
                <p className="text-sm text-muted-foreground">
                    Currently Active. Cannot close until {new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString()}.
                </p>
             </div>

          </CardContent>
        </Card>

        {/* Placeholder for future super admin stats */}
        <Card>
            <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Quick stats and reports for {prevMonthLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                   Generate comprehensive financial report for {prevMonthLabel}. Includes meal rates, total breakdown, and balances.
                </p>
                <ReportGenerator month={prevMonthStr} monthLabel={prevMonthLabel} />
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
