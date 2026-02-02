import { createClient } from '@/lib/supabase/server'
import UtilityGrid from './UtilityGrid'

export default async function UtilitiesPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  // Fetch all users for columns
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Current Month
  const today = new Date()
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthStr = currentMonthDate.toISOString().split('T')[0] // YYYY-MM-01

  // Fetch Collections for current month
  const { data: utilityCollections } = await supabase
    .from('utility_collections')
    .select('*')
    .eq('month', currentMonthStr)

  // Fetch Bills (Expenses) for current month
  const { data: utilityExpenses } = await supabase
    .from('utility_expenses')
    .select('*')
    .eq('month', currentMonthStr)

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
