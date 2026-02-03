import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

interface ShoppingPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function ShoppingPage({ searchParams }: ShoppingPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Determine selected month (from URL param or current month)
  // Format: YYYY-MM-01
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const currentMonth = params.month || defaultMonth
  const currentMonthDate = currentMonth

  // Parallel queries for faster loading
  const [
    currentUserResult, 
    usersResult, 
    itemsResult, 
    depositsResult, 
    utilityCollectionsResult, 
    utilityBillsResult, 
    transfersResult, 
    monthlyShoppingResult,
    commonExpensesResult
  ] = await Promise.all([
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
    // Filter by purchase date for the selected month
    supabase
      .from('bajar_list')
      .select('id, item_name, cost, purchase_date, user_id, user:users(name)')
      .gte('purchase_date', currentMonthDate)
      .lt('purchase_date', new Date(new Date(currentMonthDate).setMonth(new Date(currentMonthDate).getMonth() + 1)).toISOString().split('T')[0])
      .order('purchase_date', { ascending: false })
      .limit(100), // Increased limit for monthly view
      
    // Data for Manager Balance (Selected Month)
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
      
    // Transfers are cumulative? Or month based? 
    // Assuming transfers for the month or total balance?
    // Based on previous code: .gte('transfer_date', currentMonthDate)
    // This implies we only care about transfers made THIS month?
    // If we look at historical months, check transfers for THAT month only?
    // Let's stick to consistent "this month" logic for historical view too.
    supabase
      .from('fund_transfers')
      .select('amount, shopper_id')
      .gte('transfer_date', currentMonthDate)
      .lt('transfer_date', new Date(new Date(currentMonthDate).setMonth(new Date(currentMonthDate).getMonth() + 1)).toISOString().split('T')[0]),
      
    // Get all shopping items for this month to calculate shopper spent
    supabase
      .from('bajar_list')
      .select('cost, user_id')
      .gte('purchase_date', currentMonthDate)
      .lt('purchase_date', new Date(new Date(currentMonthDate).setMonth(new Date(currentMonthDate).getMonth() + 1)).toISOString().split('T')[0]),
      
    // Get common expenses for this month to deduct from shopper balance
    supabase
      .from('common_expenses')
      .select('total_cost, shopper_id, payment_preference')
      .eq('month', currentMonth)
  ])
  
  const isAdmin = currentUserResult.data?.role === 'admin'
  const users = usersResult.data
  
  // Transform items to handle potential array return from Supabase relation
  const items = itemsResult.data?.map(item => ({
    ...item,
    user: Array.isArray(item.user) ? item.user[0] : item.user
  }))

  // Calculate Manager Balance
  // ... (Calculation logic remains same, just using the fetched data) ...

  const totalRawDeposits = depositsResult.data?.reduce((sum, d) => 
    sum + (d.d1||0) + (d.d2||0) + (d.d3||0) + (d.d4||0) + (d.d5||0) + (d.d6||0) + (d.d7||0) + (d.d8||0) + (d.carry_forward||0), 0) || 0

  
  const totalUtilityCollections = utilityCollectionsResult.data?.reduce((sum, u) => sum + u.amount, 0) || 0
  const totalUtilityBills = utilityBillsResult.data?.reduce((sum, u) => sum + u.amount, 0) || 0
  const utilityRemaining = totalUtilityCollections - totalUtilityBills

  const totalTransfers = transfersResult.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalShopping = monthlyShoppingResult.data?.reduce((sum, s) => sum + Number(s.cost), 0) || 0
  
  // ... (Shopper Balance calculation remains same) ...
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
  
  // Deduct common expense amounts
  let totalPaybackOwed = 0
  
  commonExpensesResult.data?.forEach(ce => {
    if (ce.shopper_id && shopperBalances[ce.shopper_id] !== undefined) {
      const costToDeduct = Number(ce.total_cost)
      shopperBalances[ce.shopper_id] -= costToDeduct
      
      if (ce.payment_preference === 'payback' && shopperBalances[ce.shopper_id] < 0) {
        const excessFromThisExpense = Math.min(costToDeduct, Math.abs(shopperBalances[ce.shopper_id]))
        totalPaybackOwed += excessFromThisExpense
      }
    }
  })

  // Shopper Has calculation
  const totalShopperHas = Object.values(shopperBalances).reduce((sum, balance) => sum + Math.max(0, balance), 0)

  // Manager Balance
  const managerBalance = (utilityRemaining + totalRawDeposits) - (totalShopping + totalShopperHas + totalPaybackOwed)


  return (
    <ShoppingClient 
      users={users || []} 
      items={items || []} 
      isAdmin={isAdmin}
      managerBalance={managerBalance}
      shopperBalances={shopperBalances}
      currentUserId={authUser?.id || ''}
      selectedMonth={currentMonth}
    />
  )
}
