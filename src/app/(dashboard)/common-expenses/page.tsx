import { createClient } from '@/lib/supabase/server'
import CommonExpensesClient from './CommonExpensesClient'

interface CommonExpensesPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function CommonExpensesPage({ searchParams }: CommonExpensesPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Determine selected month (from URL param or current month)
  // Format: YYYY-MM-01
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonth = params.month || defaultMonth
  
  const { data: expenses } = await supabase
    .from('common_expenses')
    .select('*, shopper:users(name)')
    .eq('month', selectedMonth)
    .order('month', { ascending: false })

  return (
    <CommonExpensesClient 
      expenses={expenses || []} 
      isAdmin={isAdmin}
      users={users || []}
      selectedMonth={selectedMonth}
    />
  )
}
