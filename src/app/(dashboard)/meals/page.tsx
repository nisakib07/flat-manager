import { createClient } from '@/lib/supabase/server'
import MealsClient from './MealsClient'

export default async function MealsPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Fetch current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Fetch meal costs with user info
  const { data: mealCosts } = await supabase
    .from('meal_costs')
    .select('*, user:users(name)')
    .order('meal_date', { ascending: false })
    .limit(100)

  return (
    <MealsClient 
      users={users || []} 
      mealCosts={mealCosts || []} 
      isAdmin={isAdmin}
    />
  )
}
