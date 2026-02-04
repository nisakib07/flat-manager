import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'super_admin'
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <UsersClient 
      users={users || []} 
      isAdmin={isAdmin}
      currentUserId={authUser?.id || ''}
    />
  )
}
