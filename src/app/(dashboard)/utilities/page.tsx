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
  const [currentUserResult, usersResult, collectionsResult, expensesResult, activityLogsResult] = await Promise.all([
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
      .eq('month', selectedMonthStr),

    supabase
      .from('activity_logs')
      .select('*, actor:users!user_id(name), target:users!target_user_id(name)')
      .eq('month', selectedMonthStr)
      .in('action', ['utility_collection_update', 'utility_bill_update'])
      .order('created_at', { ascending: false })
      .limit(100)
   ])
  
  const isAdmin = currentUserResult.data?.role === 'admin' || currentUserResult.data?.role === 'super_admin'
  const users = usersResult.data
  const utilityCollections = collectionsResult.data
  const utilityExpenses = expensesResult.data

  const activityLog = activityLogsResult.data?.map(log => ({
    ...log,
    actor: Array.isArray(log.actor) ? log.actor[0] : log.actor,
    target: Array.isArray(log.target) ? log.target[0] : log.target
  })) || []

  return (
    <UtilityGrid 
      users={users || []}
      utilityCollections={utilityCollections || []}
      utilityExpenses={utilityExpenses || []}
      isAdmin={isAdmin}
      selectedMonth={selectedMonthStr}
      activityLog={activityLog}
    />
  )
}
