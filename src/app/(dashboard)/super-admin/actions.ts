'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUser?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return user
}

export async function closeMonth(month: string) {
  const user = await checkSuperAdmin()
  const supabase = await createClient()

  // 1. Fetch all necessary data for calculation
  // Define date range for db queries
  const startDate = `${month}-01`
  // Calculate next month start date safely
  const [year, monthIndex] = month.split('-').map(Number)
  const nextMonthDate = new Date(year, monthIndex, 1) // Month is 0-indexed in JS Date? No, split gives 1-based "02". 
  // Wait, new Date(year, monthIndex) -> if monthIndex is 1 (Feb), this gives Feb 1st? 
  // JS Date(2026, 1) is Feb. "2026-02".split gives [2026, 2]. 
  // new Date(2026, 2, 1) is March 1st. 
  // So if month is "2026-02", nextMonthDate is "2026-03-01". Correct.
  
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`
  const endDate = `${nextMonthStr}-01`

  // Parallel fetch for calculation data
  const [
    { data: users },
    { data: mealCosts },
    { data: bajarItems },
    { data: commonExpenses },
    { data: mealDeposits }
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('meal_costs').select('*').gte('meal_date', startDate).lt('meal_date', endDate),
    supabase.from('bajar_list').select('*').gte('purchase_date', startDate).lt('purchase_date', endDate),
    supabase.from('common_expenses').select('*').eq('month', startDate),
    supabase.from('meal_deposits').select('*').eq('month', startDate)
  ])

  if (!users || !mealCosts || !bajarItems || !commonExpenses || !mealDeposits) {
    throw new Error('Failed to fetch data for calculation')
  }

  // 2. Perform Calculation (Same logic as MealCalculation.tsx)
  const totalBajar = bajarItems.reduce((sum: number, item: { cost: number }) => sum + Number(item.cost), 0)
  const totalMealWeight = mealCosts.reduce((sum: number, meal: { meal_weight: number }) => sum + Number(meal.meal_weight), 0)
  const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0

  // Prepare next month's deposits updates
  const nextMonthDeposits = users.map(u => {
    // Meal Cost
    const userMeals = mealCosts.filter((m: { user_id: string }) => m.user_id === u.id)
    const totalWeight = userMeals.reduce((sum: number, m: { meal_weight: number }) => sum + Number(m.meal_weight), 0)
    const cost = mealRate * totalWeight
    
    // Deposit Calculation
    const userDepositRecord = mealDeposits.find((d: { user_id: string }) => d.user_id === u.id)
    const totalRawDeposit = userDepositRecord ? (
      (Number(userDepositRecord.d1) || 0) + 
      (Number(userDepositRecord.d2) || 0) + 
      (Number(userDepositRecord.d3) || 0) + 
      (Number(userDepositRecord.d4) || 0) + 
      (Number(userDepositRecord.d5) || 0) + 
      (Number(userDepositRecord.d6) || 0) + 
      (Number(userDepositRecord.d7) || 0) + 
      (Number(userDepositRecord.d8) || 0) + 
      (Number(userDepositRecord.carry_forward) || 0)
    ) : 0

    const totalCommonExpenseShare = commonExpenses.reduce((sum: number, expense: { user_share: number }) => sum + Number(expense.user_share), 0)
    const netDeposit = totalRawDeposit - totalCommonExpenseShare
    const balance = netDeposit - cost

    return {
      user_id: u.id,
      month: `${nextMonthStr}-01`,
      carry_forward: balance, /* Insert balance as carry_forward for next month */
    }
  })

  // 3. Update Status and Carry Forward
  
  // Upsert only carry_forward to avoid overwriting existing d1-d8 deposit slots
  const { error: cfError } = await supabase
    .from('meal_deposits')
    .upsert(nextMonthDeposits, { onConflict: 'user_id, month' })

  if (cfError) {
      throw new Error(`Failed to update carry forward: ${cfError.message}`)
  }

  // B. Close the month
  const { error } = await supabase
    .from('month_status')
    .upsert({
      month,
      is_closed: true,
      closed_at: new Date().toISOString(),
      closed_by: user.id
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/super-admin')
  revalidatePath('/deposits') // To see the new CF
  return { success: true }
}

export async function openMonth(month: string) {
    const user = await checkSuperAdmin()
    const supabase = await createClient()
  
    // Upsert the month status
    const { error } = await supabase
      .from('month_status')
      .upsert({
        month,
        is_closed: false,
        closed_at: null,
        closed_by: null
      })
  
    if (error) {
      throw new Error(error.message)
    }
  
    revalidatePath('/dashboard')
    revalidatePath('/super-admin')
    return { success: true }
  }


interface ReportData {
  users: any[]
  mealCosts: any[]
  bajarItems: any[]
  commonExpenses: any[]
  mealDeposits: any[]
  dailyMeals: any[]
  utilityCollections: any[]
  utilityExpenses: any[]
}

export async function getMonthlyReportData(month: string): Promise<ReportData> {
  const supabase = await createClient()
  
  // Calculate next month for range queries
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = `${month}-01`
  // Calculate end date (first day of next month)
  const nextMonthDate = new Date(year, monthNum, 1) // monthNum is 1-based (Feb=2), Date(Y, 2, 1) is Mar 1.
  const endDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`

  const [
    usersResult,
    mealCostsResult,
    bajarItemsResult,
    commonExpensesResult,
    mealDepositsResult,
    dailyMealsResult,
    utilityCollectionsResult,
    utilityExpensesResult
  ] = await Promise.all([
    supabase.from('users').select('*').order('name'),
    supabase.from('meal_costs').select('*').gte('meal_date', startDate).lt('meal_date', endDate),
    supabase.from('bajar_list').select('*, user:users(name)').gte('purchase_date', startDate).lt('purchase_date', endDate).order('purchase_date'),
    supabase.from('common_expenses').select('*').gte('month', startDate).lt('month', endDate),
    supabase.from('meal_deposits').select('*').eq('month', startDate),
    supabase.from('daily_meals').select('*, meal_type:meal_types(weight)').gte('meal_date', startDate).lt('meal_date', endDate).order('meal_date'),
    supabase.from('utility_collections').select('*').eq('month', startDate),
    supabase.from('utility_expenses').select('*').eq('month', startDate)
  ])

  return {
    users: usersResult.data || [],
    mealCosts: mealCostsResult.data || [],
    bajarItems: bajarItemsResult.data || [],
    commonExpenses: commonExpensesResult.data || [],
    mealDeposits: mealDepositsResult.data || [],
    dailyMeals: dailyMealsResult.data || [],
    utilityCollections: utilityCollectionsResult.data || [],
    utilityExpenses: utilityExpensesResult.data || []
  }
}

