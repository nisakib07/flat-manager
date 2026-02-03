import { createClient } from '@/lib/supabase/server'
import UtilityGrid from './UtilityGrid'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

export default async function UtilitiesPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Current Month
  const today = new Date()
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthStr = currentMonthDate.toISOString().split('T')[0] // YYYY-MM-01

  // Parallel queries for faster loading
  const [currentUserResult, usersResult, collectionsResult, expensesResult] = await Promise.all([
    supabase
      .from('users')
      .select('role')
      .eq('id', authUser?.id)
      .single(),
    
    supabase
      .from('users')
      .select('id, name')
      .order('name'),
    
    supabase
      .from('utility_collections')
      .select('*')
      .eq('month', currentMonthStr),
    
    supabase
      .from('utility_expenses')
      .select('*')
      .eq('month', currentMonthStr)
   ])
  
  const isAdmin = currentUserResult.data?.role === 'admin'
  const users = usersResult.data
  const utilityCollections = collectionsResult.data
  const utilityExpenses = expensesResult.data

  return (
    <UtilityGrid 
      users={users || []}
      utilityCollections={utilityCollections || []}
      utilityExpenses={utilityExpenses || []}
      isAdmin={isAdmin}
      selectedMonth={currentMonthStr}
    />
  )
}
