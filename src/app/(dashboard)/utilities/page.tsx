import { createClient } from '@/lib/supabase/server'
import UtilitiesClient from './UtilitiesClient'

export default async function UtilitiesPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  const { data: expenses } = await supabase
    .from('utility_expenses')
    .select('*')
    .order('month', { ascending: false })
    .limit(50)

  return (
    <UtilitiesClient 
      expenses={expenses || []} 
      isAdmin={isAdmin}
      usersCount={usersCount || 0}
    />
  )
}
