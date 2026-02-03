'use client'

import { useMemo } from 'react'
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

function MealCalculation({ 
  users, 
  mealCosts, 
  bajarItems,
  commonExpenses,
  mealDeposits,
  monthLabel 
}: MealCalculationProps) {
  // Memoize expensive calculations to prevent re-computation on every render
  const { totalBajar, totalMealWeight, mealRate } = useMemo(() => {
    const totalBajar = bajarItems.reduce((sum, item) => sum + Number(item.cost), 0)
    const totalMealWeight = mealCosts.reduce((sum, meal) => sum + Number(meal.meal_weight), 0)
    const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0
    
    return { totalBajar, totalMealWeight, mealRate }
  }, [bajarItems, mealCosts])

  // Memoize user summaries calculation
  const userSummaries: UserMealSummary[] = useMemo(() => {
    const summaries = users.map(user => {
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
    return summaries.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, mealCosts, mealRate, mealDeposits, commonExpenses])

  const totalDepositSum = useMemo(() => 
    userSummaries.reduce((sum, u) => sum + u.deposit, 0),
    [userSummaries]
  )
  
  const totalBalanceSum = useMemo(() => 
    userSummaries.reduce((sum, u) => sum + u.balance, 0),
    [userSummaries]
  )

  return (
    <Card className="shadow-md border-border">
      <CardHeader className="pb-3 sm:pb-4 bg-muted/30 border-b border-border">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground">
          <span className="text-lg sm:text-xl">📊</span> 
          <span className="hidden sm:inline">Meal Calculation - {monthLabel}</span>
          <span className="sm:hidden">Calculation</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-3 sm:px-6">
        {/* Summary Stats */}
        <div className="grid gap-2.5 sm:gap-4 grid-cols-3">
          <div className="rounded-xl bg-card border shadow-sm border-l-4 border-l-teal-500 p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wider">Shopping</p>
            <p className="text-lg sm:text-2xl font-black text-foreground">৳{totalBajar}</p>
            <p className="text-[9px] sm:hidden text-muted-foreground">৳{totalBajar.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-card border shadow-sm border-l-4 border-l-orange-500 p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wider">Weight</p>
            <p className="text-lg sm:text-2xl font-black text-foreground">{totalMealWeight}</p>
          </div>
          <div className="rounded-xl bg-card border shadow-sm border-l-4 border-l-blue-500 p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wider">Rate</p>
            <p className="text-lg sm:text-2xl font-black text-foreground">৳{mealRate.toFixed(1)}</p>
          </div>
        </div>

        {/* Per-User Breakdown */}
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
              <Table className="table-fixed meal-data-table">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider w-[25%]">Name</TableHead>
                  <TableHead className="!text-center font-bold text-muted-foreground uppercase text-xs tracking-wider w-[15%]">Weight</TableHead>
                  <TableHead className="!text-right font-bold text-muted-foreground uppercase text-xs tracking-wider w-[20%]">Cost</TableHead>
                  <TableHead className="!text-right font-bold text-muted-foreground uppercase text-xs tracking-wider w-[20%]">Deposit</TableHead>
                  <TableHead className="!text-right font-bold text-muted-foreground uppercase text-xs tracking-wider w-[20%]">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSummaries.map((summary) => (
                  <TableRow key={summary.userId} className={cn(
                    "border-b border-border transition-colors",
                    summary.balance < 0 
                      ? "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10 dark:hover:bg-red-900/20" 
                      : "hover:bg-muted/50"
                  )}>
                    <TableCell className="font-medium">{summary.name}</TableCell>
                    <TableCell className="text-center font-medium">{summary.totalWeight}</TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      ৳{summary.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
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
                <TableRow className="bg-muted/80 font-bold border-t border-border">
                  <TableCell className="text-foreground">Total</TableCell>
                  <TableCell className="text-center text-foreground">
                    {totalMealWeight}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ৳{totalBajar.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ৳{totalDepositSum.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ৳{totalBalanceSum.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-2 p-2">
            {userSummaries.map((summary) => (
              <div key={summary.userId} className={cn(
                "p-3 rounded-lg border active:scale-[0.98] transition-transform",
                summary.balance < 0
                  ? "bg-red-50/30 border-red-100 dark:bg-red-900/10 dark:border-red-900/50"
                  : "bg-card border-border"
              )}>
                <div className="font-semibold text-base mb-2">{summary.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{summary.totalWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium text-muted-foreground">৳{summary.cost.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span className="font-medium text-muted-foreground">৳{summary.deposit.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className={cn(
                      "font-bold",
                      summary.balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ৳{summary.balance.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formula explanation */}
        <p className="text-[10px] sm:text-xs text-muted-foreground px-1 italic">
          💡 Balance = (Deposits - Common) - (Rate × Weight)
        </p>
      </CardContent>
    </Card>
  )
}

// Export with React.memo to prevent unnecessary re-renders
export default MealCalculation
