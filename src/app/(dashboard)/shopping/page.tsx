import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

export default async function ShoppingPage() {
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
  
  const { data: items } = await supabase
    .from('bajar_list')
    .select('*, user:users(name)')
    .order('purchase_date', { ascending: false })
    .limit(100)

  return (
    <ShoppingClient 
      users={users || []} 
      items={items || []} 
      isAdmin={isAdmin}
    />
  )
}
