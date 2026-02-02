'use client'

import type { User, MealCost, BajarItem, CommonExpense, MealDeposit } from '@/types/database'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils'

interface MealCalculationProps {
  users: User[]
  mealCosts: MealCost[]
  bajarItems: BajarItem[]
  commonExpenses: CommonExpense[]
  mealDeposits: MealDeposit[]
  monthLabel: string
}

interface UserMealSummary {
  userId: string
  name: string
  totalWeight: number
  mealCount: number
  cost: number
  deposit: number
  balance: number
}

export default function MealCalculation({ 
  users, 
  mealCosts, 
  bajarItems,
  commonExpenses,
  mealDeposits,
  monthLabel 
}: MealCalculationProps) {
  // Calculate totals
  const totalBajar = bajarItems.reduce((sum, item) => sum + Number(item.cost), 0)
  const totalMealWeight = mealCosts.reduce((sum, meal) => sum + Number(meal.meal_weight), 0)
  
  // Meal rate = Total Bajar / Total Meal Weight
  const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0

  // Calculate per-user summaries
  const userSummaries: UserMealSummary[] = users.map(user => {
    // Meal Cost
    const userMeals = mealCosts.filter(m => m.user_id === user.id)
    const totalWeight = userMeals.reduce((sum, m) => sum + Number(m.meal_weight), 0)
    const mealCount = userMeals.length
    const cost = mealRate * totalWeight
    
    // Deposit Calculation (Sum of all D1-D8 + Carry Forward)
    const userDepositRecord = mealDeposits.find(d => d.user_id === user.id)
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

    // Common Expense Calculation (Sum of user's share for all common expenses)
    // Note: common_expenses table has `user_share` which is the amount PER PERSON.
    // So we just sum up the `user_share` of all expenses.
    const totalCommonExpenseShare = commonExpenses.reduce((sum, expense) => sum + Number(expense.user_share), 0)

    // Net Deposit = Total Deposit - Total Common Expense Share
    const netDeposit = totalRawDeposit - totalCommonExpenseShare

    // Balance = Net Deposit - Meal Cost
    const balance = netDeposit - cost

    return {
      userId: user.id,
      name: user.name,
      totalWeight,
      mealCount,
      cost,
      deposit: netDeposit,
      balance
    }
  })

  // Sort by name for consistent list
  userSummaries.sort((a, b) => a.name.localeCompare(b.name))

  const totalDepositSum = userSummaries.reduce((sum, u) => sum + u.deposit, 0)
  const totalBalanceSum = userSummaries.reduce((sum, u) => sum + u.balance, 0)

  return (
    <Card className="shadow-md border-teal-100 dark:border-teal-900/50">
      <CardHeader className="pb-4 bg-teal-50/30 dark:bg-teal-950/20 border-b border-teal-100 dark:border-teal-900/50">
        <CardTitle className="text-lg flex items-center gap-2 text-teal-900 dark:text-teal-100">
          <span className="text-xl">📊</span> Meal Calculation - {monthLabel}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Summary Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl border border-teal-100 bg-white dark:bg-teal-950/30 dark:border-teal-900 p-5 shadow-sm">
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-wider">Total Shopping</p>
            <p className="text-2xl font-black text-teal-900 dark:text-teal-100">৳{totalBajar.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-white dark:bg-orange-950/30 dark:border-orange-900 p-5 shadow-sm">
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">Total Weight</p>
            <p className="text-2xl font-black text-orange-900 dark:text-orange-100">{totalMealWeight.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-900 p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Meal Rate</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">৳{mealRate.toFixed(2)}</p>
          </div>
        </div>

        {/* Per-User Breakdown */}
        <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 overflow-hidden shadow-sm">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-teal-50/50 dark:bg-teal-950/20 border-b border-teal-100 dark:border-teal-900">
                <TableHead className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider w-[25%]">Name</TableHead>
                <TableHead className="!text-center font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider w-[15%]">Weight</TableHead>
                <TableHead className="!text-right font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider w-[20%]">Cost</TableHead>
                <TableHead className="!text-right font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider w-[20%]">Deposit</TableHead>
                <TableHead className="!text-right font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider w-[20%]">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userSummaries.map((summary) => (
                <TableRow key={summary.userId} className="hover:bg-teal-50/20 dark:hover:bg-teal-900/10 border-b border-teal-50 dark:border-teal-900/30">
                  <TableCell className="font-medium">{summary.name}</TableCell>
                  <TableCell className="text-center font-medium">{summary.totalWeight}</TableCell>
                  <TableCell className="text-right font-medium text-teal-600 dark:text-teal-400">
                    ৳{summary.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-teal-600 dark:text-teal-400">
                    ৳{summary.deposit.toFixed(2)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    summary.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    ৳{summary.balance.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-teal-100 dark:bg-teal-900/50 font-bold border-t border-teal-200 dark:border-teal-800">
                <TableCell className="text-teal-900 dark:text-teal-100">Total</TableCell>
                <TableCell className="text-center text-teal-900 dark:text-teal-100">
                  {totalMealWeight}
                </TableCell>
                <TableCell className="text-right text-teal-900 dark:text-teal-100">
                  ৳{totalBajar.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-teal-900 dark:text-teal-100">
                  ৳{totalDepositSum.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-teal-900 dark:text-teal-100">
                  ৳{totalBalanceSum.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Formula explanation */}
        <p className="text-xs text-muted-foreground px-1 italic">
          💡 Deposit = (Total Deposits - Common Expenses) <br/>
          💡 Balance = Deposit - (Meal Rate × Personal Weight)
        </p>
      </CardContent>
    </Card>
  )
}
