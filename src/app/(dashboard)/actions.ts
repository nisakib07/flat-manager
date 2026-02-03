'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addMealCost(formData: FormData) {
  const supabase = await createClient()
  
  const user_id = formData.get('user_id') as string
  const meal_date = formData.get('meal_date') as string
  const meal_type = formData.get('meal_type') as string
  const meal_weight = Number(formData.get('meal_weight'))
  const cost = Number(formData.get('cost'))

  const { error } = await supabase
    .from('meal_costs')
    .insert({
      user_id,
      meal_date,
      meal_type,
      meal_weight,
      cost
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/meals')
  return { success: true }
}

export async function deleteMealCost(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('meal_costs')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/meals')
  return { success: true }
}

export async function addBajarItem(formData: FormData) {
  const supabase = await createClient()
  
  const user_id = formData.get('user_id') as string
  const item_name = formData.get('item_name') as string
  const cost = Number(formData.get('cost'))
  const purchase_date = formData.get('purchase_date') as string

  const { error } = await supabase
    .from('bajar_list')
    .insert({
      user_id,
      item_name,
      cost,
      purchase_date
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shopping')
  return { success: true }
}

export async function updateBajarItem(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const user_id = formData.get('user_id') as string
  const item_name = formData.get('item_name') as string
  const cost = Number(formData.get('cost'))
  const purchase_date = formData.get('purchase_date') as string

  const { error } = await supabase
    .from('bajar_list')
    .update({
      user_id,
      item_name,
      cost,
      purchase_date
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shopping')
  return { success: true }
}

export async function deleteBajarItem(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bajar_list')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shopping')
  return { success: true }
}

export async function addUtilityExpense(formData: FormData) {
  const supabase = await createClient()
  
  const expense_type = formData.get('expense_type') as string
  const amount = Number(formData.get('amount'))
  const month = formData.get('month') as string

  const { error } = await supabase
    .from('utility_expenses')
    .insert({
      expense_type,
      amount,
      month
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/utilities')
  return { success: true }
}

export async function deleteUtilityExpense(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('utility_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/utilities')
  return { success: true }
}

export async function addCommonExpense(formData: FormData) {
  const supabase = await createClient()
  
  const expense_name = formData.get('expense_name') as string
  const total_cost = Number(formData.get('total_cost'))
  const month = formData.get('month') as string
  const shopper_id = formData.get('shopper_id') as string
  const payment_preference = (formData.get('payment_preference') as string) || 'deposit'
  
  // Get current month for balance calculations
  const today = new Date()
  const year = today.getFullYear()
  const monthNum = String(today.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${monthNum}-01`
  
  // Get user count for calculating share
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  const user_share = count ? total_cost / count : total_cost

  // Calculate shopper's current balance before this expense
  // Balance = Transfers - Shopping - Common Expenses
  const [transfersResult, shoppingResult, commonExpensesResult] = await Promise.all([
    supabase
      .from('fund_transfers')
      .select('amount')
      .eq('shopper_id', shopper_id)
      .gte('transfer_date', currentMonth),
    supabase
      .from('bajar_list')
      .select('cost')
      .eq('user_id', shopper_id)
      .gte('purchase_date', currentMonth),
    supabase
      .from('common_expenses')
      .select('total_cost')
      .eq('shopper_id', shopper_id)
      .eq('month', currentMonth)
  ])

  const totalTransfers = transfersResult.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalShopping = shoppingResult.data?.reduce((sum, s) => sum + Number(s.cost), 0) || 0
  const totalCommonExpenses = commonExpensesResult.data?.reduce((sum, c) => sum + Number(c.total_cost), 0) || 0
  
  const currentBalance = totalTransfers - totalShopping - totalCommonExpenses
  
  // Check if the new expense exceeds the balance
  const excessAmount = total_cost - currentBalance
  
  // Track auto-deposit info for potential reversal on delete
  let autoDepositAmount = 0
  let autoDepositSlot: string | null = null
  
  // Only auto-deposit if preference is 'deposit' and there's an excess
  if (payment_preference === 'deposit' && excessAmount > 0) {
    autoDepositAmount = excessAmount
    
    // Get existing deposit record for the shopper this month
    const { data: existingDeposit } = await supabase
      .from('meal_deposits')
      .select('*')
      .eq('user_id', shopper_id)
      .eq('month', currentMonth)
      .single()

    if (existingDeposit) {
      // Find the first empty slot (D1-D8) and add the excess
      const depositSlots = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'] as const
      
      for (const slot of depositSlots) {
        if (!existingDeposit[slot] || existingDeposit[slot] === 0) {
          autoDepositSlot = slot
          break
        }
      }
      
      if (autoDepositSlot) {
        await supabase
          .from('meal_deposits')
          .update({ [autoDepositSlot]: excessAmount })
          .eq('id', existingDeposit.id)
      }
    } else {
      // Create a new deposit record with the excess in D1
      autoDepositSlot = 'd1'
      await supabase
        .from('meal_deposits')
        .insert({
          user_id: shopper_id,
          month: currentMonth,
          d1: excessAmount
        })
    }
    
    revalidatePath('/deposits')
  }

  // Insert the common expense with auto-deposit tracking info
  const { error } = await supabase
    .from('common_expenses')
    .insert({
      expense_name,
      total_cost,
      user_share,
      month,
      shopper_id,
      auto_deposit_amount: autoDepositAmount,
      auto_deposit_slot: autoDepositSlot,
      payment_preference
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/common-expenses')
  revalidatePath('/shopping')
  return { success: true }
}

export async function deleteCommonExpense(id: string) {
  const supabase = await createClient()
  
  // First, get the expense to check for auto-deposit info
  const { data: expense } = await supabase
    .from('common_expenses')
    .select('shopper_id, month, auto_deposit_amount, auto_deposit_slot')
    .eq('id', id)
    .single()
  
  // If there was an auto-deposit, reverse it
  if (expense?.auto_deposit_amount && expense?.auto_deposit_slot && expense?.shopper_id) {
    // Get the deposit record
    const { data: deposit } = await supabase
      .from('meal_deposits')
      .select('id')
      .eq('user_id', expense.shopper_id)
      .eq('month', expense.month)
      .single()
    
    if (deposit) {
      // Clear the auto-deposit slot
      await supabase
        .from('meal_deposits')
        .update({ [expense.auto_deposit_slot]: 0 })
        .eq('id', deposit.id)
      
      revalidatePath('/deposits')
    }
  }
  
  // Now delete the expense
  const { error } = await supabase
    .from('common_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/common-expenses')
  revalidatePath('/shopping')
  return { success: true }
}

export async function updateCommonExpense(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const expense_name = formData.get('expense_name') as string
  const total_cost = Number(formData.get('total_cost'))
  const month = formData.get('month') as string
  const shopper_id = formData.get('shopper_id') as string
  
  // Get user count for calculating share
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  const user_share = count ? total_cost / count : total_cost

  const { error } = await supabase
    .from('common_expenses')
    .update({
      expense_name,
      total_cost,
      user_share,
      month,
      shopper_id
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/common-expenses')
  return { success: true }
}

export async function updateDepositSlot(
  userId: string,
  month: string,
  field: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'carry_forward',
  value: number
) {
  const supabase = await createClient()
  
  // Check if record exists
  const { data: existing } = await supabase
    .from('meal_deposits')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  if (existing) {
    // Update specific field
    const { error } = await supabase
      .from('meal_deposits')
      .update({ [field]: value })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    // Create new record with specific field set
    const { error } = await supabase
      .from('meal_deposits')
      .insert({
        user_id: userId,
        month,
        [field]: value
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/deposits')
  return { success: true }
}

export async function updateUserRole(userId: string, role: 'admin' | 'viewer') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  revalidatePath('/dashboard')
  return { success: true }
}

// Set what meal is being served for a specific date and time (Lunch/Dinner)
export async function setDailyMeal(date: string, mealTime: 'Lunch' | 'Dinner', mealTypeId: string | null) {
  const supabase = await createClient()
  
  // Upsert the daily meal
  const { error } = await supabase
    .from('daily_meals')
    .upsert({
      meal_date: date,
      meal_time: mealTime,
      meal_type_id: mealTypeId
    }, {
      onConflict: 'meal_date,meal_time'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Toggle a user's meal attendance for a specific date and meal time
export async function toggleUserMealAttendance(
  userId: string, 
  date: string, 
  mealTime: 'Lunch' | 'Dinner',
  mealWeight: number
) {
  const supabase = await createClient()
  
  // Check if entry exists
  const { data: existing } = await supabase
    .from('meal_costs')
    .select('id')
    .eq('user_id', userId)
    .eq('meal_date', date)
    .eq('meal_type', mealTime)
    .single()

  if (existing) {
    // Remove the meal entry
    const { error } = await supabase
      .from('meal_costs')
      .delete()
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Add the meal entry
    const { error } = await supabase
      .from('meal_costs')
      .insert({
        user_id: userId,
        meal_date: date,
        meal_type: mealTime,
        meal_weight: mealWeight,
        cost: 0
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Toggle all users' meal attendance for a specific date and meal time
export async function toggleAllMeals(
  date: string, 
  mealTime: 'Lunch' | 'Dinner',
  userIds: string[],
  enable: boolean,
  mealWeight: number
) {
  const supabase = await createClient()
  
  if (enable) {
    // Add meals for all users who don't have one
    const { data: existing } = await supabase
      .from('meal_costs')
      .select('user_id')
      .eq('meal_date', date)
      .eq('meal_type', mealTime)

    const existingUserIds = existing?.map(e => e.user_id) || []
    const usersToAdd = userIds.filter(id => !existingUserIds.includes(id))

    if (usersToAdd.length > 0) {
      const { error } = await supabase
        .from('meal_costs')
        .insert(usersToAdd.map(userId => ({
          user_id: userId,
          meal_date: date,
          meal_type: mealTime,
          meal_weight: mealWeight,
          cost: 0
        })))

      if (error) {
        return { error: error.message }
      }
    }

    // Update existing users to match the selected weight
    // This ensures if "Add All" is clicked, everyone is synced to the current meal type weight
    if (existingUserIds.length > 0) {
      const { error: updateError } = await supabase
        .from('meal_costs')
        .update({ meal_weight: mealWeight })
        .eq('meal_date', date)
        .eq('meal_type', mealTime)
        .in('user_id', existingUserIds)

      if (updateError) {
        return { error: updateError.message }
      }
    }
  } else {
    // Remove all meals for this date and time
    const { error } = await supabase
      .from('meal_costs')
      .delete()
      .eq('meal_date', date)
      .eq('meal_type', mealTime)
      .in('user_id', userIds)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Update a meal's weight (for guest handling)
export async function updateMealWeight(mealId: string, newWeight: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('meal_costs')
    .update({ meal_weight: newWeight })
    .eq('id', mealId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Delete a specific meal entry
export async function deleteMealEntry(mealId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('meal_costs')
    .delete()
    .eq('id', mealId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Add a meal with custom weight
export async function addMealWithWeight(
  userId: string,
  date: string,
  mealTime: 'Lunch' | 'Dinner',
  weight: number
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('meal_costs')
    .insert({
      user_id: userId,
      meal_date: date,
      meal_type: mealTime,
      meal_weight: weight,
      cost: 0
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Create a new meal type
export async function createMealType(name: string, weight: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meal_types')
    .insert({ name, weight })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, mealType: data }
}

// Update user's contribution for a utility
export async function updateUtilityCollection(
  month: string, 
  utilityType: string, 
  userId: string, 
  amount: number
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('utility_collections')
    .upsert({
      month,
      utility_type: utilityType,
      user_id: userId,
      amount
    }, {
      onConflict: 'month,utility_type,user_id'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/utilities')
  return { success: true }
}

// Update the total bill amount for a utility
export async function updateUtilityBill(
  month: string, 
  utilityType: string, 
  amount: number
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('utility_expenses')
    .upsert({
      month,
      expense_type: utilityType,
      amount
    }, {
      onConflict: 'month,expense_type'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/utilities')
  return { success: true }
}

export type UtilityUpdate = {
  type: 'collection' | 'bill'
  month: string
  utilityType: string
  userId?: string
  amount: number
}

// Batch update utility data
export async function batchUpdateUtilities(updates: UtilityUpdate[]) {
  const supabase = await createClient()
  
  const results = await Promise.all(updates.map(async (update) => {
    if (update.type === 'collection' && update.userId) {
      return supabase
        .from('utility_collections')
        .upsert({
          month: update.month,
          utility_type: update.utilityType,
          user_id: update.userId,
          amount: update.amount
        }, {
          onConflict: 'month,utility_type,user_id'
        })
    } else if (update.type === 'bill') {
      return supabase
        .from('utility_expenses')
        .upsert({
          month: update.month,
          expense_type: update.utilityType,
          amount: update.amount
        }, {
          onConflict: 'month,expense_type'
        })
    }
    return Promise.resolve({ error: null })
  }))

  const errors = results.filter(r => r.error).map(r => r.error?.message)
  
  if (errors.length > 0) {
    return { error: errors.join(', ') }
  }

  revalidatePath('/utilities')
  return { success: true }
}

export async function addFundTransfer(formData: FormData) {
  const supabase = await createClient()
  
  const shopper_id = formData.get('shopper_id') as string
  const amount = Number(formData.get('amount'))
  const transfer_date = formData.get('transfer_date') as string
  
  const { error } = await supabase
    .from('fund_transfers')
    .insert({
      shopper_id,
      amount,
      transfer_date
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shopping')
  return { success: true }
}

export type MealUpdate = {
  userId: string
  date: string
  mealTime: 'Lunch' | 'Dinner'
  weight: number
}

export async function batchUpdateDailyMeals(updates: MealUpdate[]) {
  const supabase = await createClient()
  
  const results = await Promise.all(updates.map(async (update) => {
    // If weight is 0, delete the entry
    if (update.weight <= 0) {
      return supabase
        .from('meal_costs')
        .delete()
        .eq('user_id', update.userId)
        .eq('meal_date', update.date)
        .eq('meal_type', update.mealTime)
    } else {
      // Otherwise upsert (insert or update)
      // First check if it exists to know whether to insert or update (handling the ID)
      const { data: existing } = await supabase
        .from('meal_costs')
        .select('id')
        .eq('user_id', update.userId)
        .eq('meal_date', update.date)
        .eq('meal_type', update.mealTime)
        .single()

      if (existing) {
        return supabase
          .from('meal_costs')
          .update({ meal_weight: update.weight })
          .eq('id', existing.id)
      } else {
        return supabase
          .from('meal_costs')
          .insert({
            user_id: update.userId,
            meal_date: update.date,
            meal_type: update.mealTime,
            meal_weight: update.weight,
            cost: 0
          })
      }
    }
  }))

  const errors = results.filter(r => r.error).map(r => r.error?.message)
  
  if (errors.length > 0) {
    return { error: errors.join(', ') }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
