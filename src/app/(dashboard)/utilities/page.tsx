import { createClient } from '@/lib/supabase/server'
import UtilityGrid from './UtilityGrid'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

interface UtilitiesPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function UtilitiesPage({ searchParams }: UtilitiesPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Determine selected month (from URL param or current month)
  // Format: YYYY-MM-01
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonthStr = params.month || defaultMonth

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
      .eq('month', selectedMonthStr),
    
    supabase
      .from('utility_expenses')
      .select('*')
      .eq('month', selectedMonthStr)
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
      selectedMonth={selectedMonthStr}
    />
  )
}
