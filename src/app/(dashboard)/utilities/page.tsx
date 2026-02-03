import { createClient } from '@/lib/supabase/server'
import UtilityGrid from './UtilityGrid'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

export default async function UtilitiesPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Current Month (Local Timezone Safe)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const currentMonthStr = `${year}-${month}-01`

  // Parallel queries for faster loading
  const [currentUserResult, usersResult, collectionsResult, expensesResult] = await Promise.all([
    supabase
      .from('users')
      .select('role')
      .eq('id', authUser?.id)
      .single(),
    
    supabase
      .from('users')
      .select('*')
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
