import { createClient } from '@/lib/supabase/server'
import MonthlyMealGrid from './MonthlyMealGrid'

export default async function MealsPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Fetch current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Determine current month range
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  // Fetch meal costs for the current month
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
      selectedDate={today.toISOString().split('T')[0]}
      isAdmin={isAdmin}
    />
  )
}
