import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

export default async function ShoppingPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Fetch current month for balance calculations
  // NOTE: Utilities usage YYYY-MM-01 format, so we must match that
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${month}-01` // YYYY-MM-01 (Local time based)
  const currentMonthDate = currentMonth

  // Parallel queries for faster loading
  const [currentUserResult, usersResult, itemsResult, depositsResult, utilityCollectionsResult, utilityBillsResult, transfersResult, monthlyShoppingResult] = await Promise.all([
    supabase
      .from('users')
      .select('role')
      .eq('id', authUser?.id)
      .single(),
    
    supabase
      .from('users')
      .select('id, name')
      .order('name'),
    
    // Reduced from 100 to 50 for better initial load performance
    supabase
      .from('bajar_list')
      .select('id, item_name, cost, purchase_date, user_id, user:users(name)')
      .order('purchase_date', { ascending: false })
      .limit(50),
      
    // Data for Manager Balance (Current Month)
    supabase
      .from('meal_deposits')
      .select('d1, d2, d3, d4, d5, d6, d7, d8, carry_forward')
      .eq('month', currentMonth),
      
    supabase
      .from('utility_collections')
      .select('amount')
      .eq('month', currentMonth),
      
    supabase
      .from('utility_expenses')
      .select('amount')
      .eq('month', currentMonth),
      
    supabase
      .from('fund_transfers')
      .select('amount, shopper_id')
      .gte('transfer_date', currentMonthDate),
      
    // Get all shopping items for this month to calculate shopper spent
    supabase
      .from('bajar_list')
      .select('cost, user_id')
      .gte('purchase_date', currentMonthDate)
  ])
  
  const isAdmin = currentUserResult.data?.role === 'admin'
  const users = usersResult.data
  
  // Transform items to handle potential array return from Supabase relation
  const items = itemsResult.data?.map(item => ({
    ...item,
    user: Array.isArray(item.user) ? item.user[0] : item.user
  }))

  // Calculate Manager Balance
  // Formula: (Utility Remaining + Total Deposits) - (Total Spent from Shopping + Shopper Has)
  
  const totalDeposits = depositsResult.data?.reduce((sum, d) => 
    sum + (d.d1||0) + (d.d2||0) + (d.d3||0) + (d.d4||0) + (d.d5||0) + (d.d6||0) + (d.d7||0) + (d.d8||0) + (d.carry_forward||0), 0) || 0
  
  const totalUtilityCollections = utilityCollectionsResult.data?.reduce((sum, u) => sum + u.amount, 0) || 0
  const totalUtilityBills = utilityBillsResult.data?.reduce((sum, u) => sum + u.amount, 0) || 0
  const utilityRemaining = totalUtilityCollections - totalUtilityBills

  const totalTransfers = transfersResult.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalShopping = monthlyShoppingResult.data?.reduce((sum, s) => sum + Number(s.cost), 0) || 0
  
  // Calculate Shopper Balances first
  const shopperBalances: Record<string, number> = {}
  users?.forEach(u => shopperBalances[u.id] = 0)
  
  transfersResult.data?.forEach(t => {
    if (shopperBalances[t.shopper_id] !== undefined) {
      shopperBalances[t.shopper_id] += Number(t.amount)
    }
  })
  
  monthlyShoppingResult.data?.forEach(s => {
    if (shopperBalances[s.user_id] !== undefined) {
      shopperBalances[s.user_id] -= Number(s.cost)
    }
  })

  // Sum of all POSITIVE shopper balances? 
  // No, sum of all balances (net cash held by shoppers)
  // Shopper Has = Transfers - Shopping
  // Total Shopper Has = Total Transfers - Total Shopping
  const totalShopperHas = Object.values(shopperBalances).reduce((sum, balance) => sum + balance, 0)

  // Manager Balance
  const managerBalance = (utilityRemaining + totalDeposits) - (totalShopping + totalShopperHas)


  return (
    <ShoppingClient 
      users={users || []} 
      items={items || []} 
      isAdmin={isAdmin}
      managerBalance={managerBalance}
      shopperBalances={shopperBalances}
      currentUserId={authUser?.id || ''}
    />
  )
}
