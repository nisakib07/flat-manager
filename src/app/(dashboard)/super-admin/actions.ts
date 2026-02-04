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
    supabase.from('common_expenses').select('*').eq('month', month),
    supabase.from('meal_deposits').select('*').eq('month', month)
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
      month: nextMonthStr,
      carry_forward: balance, /* Insert balance as carry_forward for next month */
      // Initialize other fields if new row
      d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0
    }
  })

  // 3. Update Status and Carry Forward
  
  // Transaction-like update: if one fails, we might have issues, but Supabase doesn't support complex transactions via JS client easily.
  // We will do them sequentially.

  // A. Upsert next month's deposits (Carry Forward)
  const { error: depositError } = await supabase
    .from('meal_deposits')
    .upsert(nextMonthDeposits, { onConflict: 'user_id, month' }) 
    // Note: onConflict should match the unique constraint. 
    // Assuming unique constraint on (user_id, month).
    // CAUTION: This overwrites existing CF if next month already has data. 
    // BUT we usually only close a month once. And if we re-close, we WANT to update the CF.
    // However, we should be careful NOT to wipe out d1-d8 if they already exist for next month?
    // .upsert with ignoreDuplicates: false (default) updates the row.
    // We only want to update `carry_forward`. 
    // We should probably iterate and checks if we can just update `carry_forward` if row exists?
    // Or simpler: Upsert is fine, but we passed d1:0... if row exists, this might overwrite d1 with 0?
    // YES. Upsert replaces the row or updates fields provided.
    // If next month ALREADY has deposits (unlikely if we stick to flexible flow, but possible), we shouldn't wipe them.
    
    // Better strategy:
    // For each user, trigger an explicit UPSERT that preserves other columns if possible, 
    // OR just upsert { user_id, month, carry_forward }.
    // If I upsert ONLY those fields, Supabase (Postgres) will usually default others (0) on INSERT, 
    // or keep them on UPDATE?
    // Postgres ON CONFLICT DO UPDATE SET ...
    // The JS client `upsert({ user_id, month, carry_forward })` will:
    // 1. Try INSERT. If defaults are set for d1..d8 (likely 0 or null), it works.
    // 2. If CONFLICT, it UPDATES the columns provided.
    // So if I ONLY provide `carry_forward`, it should be safe for existing rows too!
    
  // Refined nextMonthDeposits for safety
  const safeNextMonthDeposits = nextMonthDeposits.map(({ user_id, month, carry_forward }) => ({
    user_id, 
    month, 
    carry_forward
  }))

  const { error: cfError } = await supabase
    .from('meal_deposits')
    .upsert(safeNextMonthDeposits, { onConflict: 'user_id, month' })

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
