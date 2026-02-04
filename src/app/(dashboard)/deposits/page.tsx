import { createClient } from '@/lib/supabase/server'
import DepositsClient from './DepositsClient'

interface DepositsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function DepositsPage({ searchParams }: DepositsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Determine selected month (from URL param or current month)
  // Format: YYYY-MM-01
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonth = params.month || defaultMonth
  
  const { data: deposits } = await supabase
    .from('meal_deposits')
    .select('*, user:users(name)')
    .eq('month', selectedMonth)
    .order('user(name)', { ascending: true, nullsFirst: false }) // Order by user name

  return (
    <DepositsClient 
      users={users || []} 
      deposits={deposits || []} 
      isAdmin={isAdmin}
      currentUserId={authUser?.id || ''}
      selectedMonth={selectedMonth}
    />
  )
}
