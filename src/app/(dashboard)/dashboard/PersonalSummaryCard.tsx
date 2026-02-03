'use client'

import { useMemo } from 'react'
import type { User, MealCost, BajarItem, CommonExpense, MealDeposit } from '@/types/database'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, Utensils } from 'lucide-react'

interface PersonalSummaryCardProps {
  currentUserId: string | undefined
  users: User[]
  mealCosts: MealCost[]
  bajarItems: BajarItem[]
  commonExpenses: CommonExpense[]
  mealDeposits: MealDeposit[]
}

export default function PersonalSummaryCard({
  currentUserId,
  users,
  mealCosts,
  bajarItems,
  commonExpenses,
  mealDeposits
}: PersonalSummaryCardProps) {
  
  const stats = useMemo(() => {
    if (!currentUserId) return null
    
    const currentUser = users.find(u => u.id === currentUserId)
    if (!currentUser) return null

    // 1. Calculate Meal Rate
    const totalBajar = bajarItems.reduce((sum, item) => sum + Number(item.cost), 0)
    const totalMealWeight = mealCosts.reduce((sum, meal) => sum + Number(meal.meal_weight), 0)
    const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0

    // 2. Calculate User Meal Cost
    const userMeals = mealCosts.filter(m => m.user_id === currentUserId)
    const myTotalWeight = userMeals.reduce((sum, m) => sum + Number(m.meal_weight), 0)
    const myMealCount = userMeals.length
    const myCost = mealRate * myTotalWeight

    // 3. Calculate User Deposit
    const userDepositRecord = mealDeposits.find(d => d.user_id === currentUserId)
    const myTotalDeposit = userDepositRecord ? (
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

    // 4. Calculate Common Expense Share
    const myCommonExpenseShare = commonExpenses.reduce((sum, expense) => sum + Number(expense.user_share), 0)

    // 5. Final Balance
    const netDeposit = myTotalDeposit - myCommonExpenseShare
    const balance = netDeposit - myCost

    return {
      mealRate,
      myTotalWeight,
      myMealCount,
      myCost,
      myTotalDeposit,
      balance,
      netDeposit
    }
  }, [currentUserId, users, mealCosts, bajarItems, commonExpenses, mealDeposits])

  if (!stats) return null

  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <Wallet className="w-5 h-5" /> Your Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-indigo-100 mb-1">Current Balance</p>
              <h3 className="text-3xl font-bold tracking-tight">
                ৳{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${stats.balance >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}>
              {stats.balance >= 0 ? 'Surplus' : 'Due'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-indigo-100 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Meal Rate</span>
                </div>
                <p className="text-lg font-semibold">৳{stats.mealRate.toFixed(1)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-indigo-100 mb-1">
                    <Utensils className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Meals</span>
                </div>
                <p className="text-lg font-semibold">{stats.myTotalWeight} <span className="text-xs font-normal opacity-70">({stats.myMealCount})</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
