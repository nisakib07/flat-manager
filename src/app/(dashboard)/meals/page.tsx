import { createClient } from '@/lib/supabase/server'
import MonthlyMealGrid from './MonthlyMealGrid'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

interface MealsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Fetch current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
  
  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Determine selected month (from URL param or current month)
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonth = params.month || defaultMonth
  
  // Parse month for date range
  const [year, month] = selectedMonth.split('-').map(Number)
  // Format dates manually to avoid timezone issues with toISOString()
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Fetch meal costs for the selected month
  const { data: monthlyMealCosts } = await supabase
    .from('meal_costs')
    .select('*, user:users(name)')
    .gte('meal_date', startOfMonth)
    .lte('meal_date', endOfMonth)
    .order('meal_date', { ascending: true })

  return (
    <MonthlyMealGrid 
      users={users || []} 
      monthlyMealCosts={monthlyMealCosts || []} 
      selectedDate={startOfMonth}
      selectedMonth={selectedMonth}
      isAdmin={isAdmin}
    />
  )
}

