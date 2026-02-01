import { createClient } from '@/lib/supabase/server'
import DepositsClient from './DepositsClient'

export default async function DepositsPage() {
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
    .select('*')
    .order('name')
  
  const { data: deposits } = await supabase
    .from('meal_deposits')
    .select('*, user:users(name)')
    .order('month', { ascending: false })

  return (
    <DepositsClient 
      users={users || []} 
      deposits={deposits || []} 
      isAdmin={isAdmin}
      currentUserId={authUser?.id || ''}
    />
  )
}
