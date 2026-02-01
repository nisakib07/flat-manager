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
  
  // Get user count for calculating share
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  const user_share = count ? total_cost / count : total_cost

  const { error } = await supabase
    .from('common_expenses')
    .insert({
      expense_name,
      total_cost,
      user_share,
      month
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/common-expenses')
  return { success: true }
}

export async function deleteCommonExpense(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('common_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/common-expenses')
  return { success: true }
}

export async function addDeposit(formData: FormData) {
  const supabase = await createClient()
  
  const user_id = formData.get('user_id') as string
  const deposit = Number(formData.get('deposit'))
  const month = formData.get('month') as string

  // Check if deposit exists for this user/month
  const { data: existing } = await supabase
    .from('meal_deposits')
    .select('id, deposit')
    .eq('user_id', user_id)
    .eq('month', month)
    .single()

  if (existing) {
    // Update existing deposit
    const { error } = await supabase
      .from('meal_deposits')
      .update({ deposit: existing.deposit + deposit })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new deposit
    const { error } = await supabase
      .from('meal_deposits')
      .insert({
        user_id,
        deposit,
        month,
        carry_forward: 0
      })

    if (error) {
      return { error: error.message }
    }
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
