import { createClient } from '@/lib/supabase/server'
import CommonExpensesClient from './CommonExpensesClient'

export default async function CommonExpensesPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .order('name')
  
  const { data: expenses } = await supabase
    .from('common_expenses')
    .select('*')
    .order('month', { ascending: false })

  return (
    <CommonExpensesClient 
      expenses={expenses || []} 
      isAdmin={isAdmin}
      users={users || []}
    />
  )
}
