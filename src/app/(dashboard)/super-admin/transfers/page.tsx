
import { createClient } from '@/lib/supabase/server'
import TransferLogClient from './TransferLogClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TransfersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verify super admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (userData?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch all transfers with shopper details
  const { data: transfers } = await supabase
    .from('fund_transfers')
    .select('*, shopper:users!shopper_id(name)')
    .order('transfer_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Fetch all users for the edit form
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .order('name')

  // Transform to match interface
  const formattedTransfers = transfers?.map(t => ({
    ...t,
    shopper: Array.isArray(t.shopper) ? t.shopper[0] : t.shopper
  })) || []

  return (
    <div className="max-w-4xl mx-auto py-8">
      <TransferLogClient initialTransfers={formattedTransfers} users={users || []} />
    </div>
  )
}
