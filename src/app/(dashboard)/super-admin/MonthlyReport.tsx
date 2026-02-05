import React, { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface MonthlyReportProps {
  monthLabel: string
  data: {
    users: any[]
    mealCosts: any[]
    bajarItems: any[]
    commonExpenses: any[]
    mealDeposits: any[]
    dailyMeals: any[]
    utilityCollections: any[]
    utilityExpenses: any[]
  }
}

export const MonthlyReport = React.forwardRef<HTMLDivElement, MonthlyReportProps>(({ monthLabel, data }, ref) => {
  const { users, mealCosts, bajarItems, commonExpenses, mealDeposits, dailyMeals, utilityCollections, utilityExpenses } = data

  // --- Main Calculation Logic ---
  const { totalBajar, totalMealWeight, mealRate } = useMemo(() => {
    const totalBajar = bajarItems?.reduce((sum, item) => sum + Number(item.cost), 0) || 0
    const totalMealWeight = mealCosts?.reduce((sum, meal) => sum + Number(meal.meal_weight), 0) || 0
    const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0
    
    return { totalBajar, totalMealWeight, mealRate }
  }, [bajarItems, mealCosts])

  const userSummaries = useMemo(() => {
    if (!users) return []
    const summaries = users.map(user => {
      // Meal Cost
      const userMeals = mealCosts?.filter(m => m.user_id === user.id) || []
      const totalWeight = userMeals.reduce((sum, m) => sum + Number(m.meal_weight), 0)
      const mealCount = userMeals.length
      const cost = mealRate * totalWeight
      
      // Deposit
      const userDepositRecord = mealDeposits?.find(d => d.user_id === user.id)
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

      // Common Expense
      const totalCommonExpenseShare = commonExpenses?.reduce((sum, expense) => sum + Number(expense.user_share), 0) || 0

      // Utilities Share (Calculated simply as total bills / users count if per-person, OR custom logic. 
      // Current system seems to handle utilities separately in UtilityGrid. 
      // But typically "Manager Balance" includes utilities?
      // For now, let's keep Utility separate display as requested ("utility table"), 
      // and NOT subtract from main balance unless that's how the app logic works.
      // Based on previous chats, Utility seems separate module. I will just list it.)

      const netDeposit = totalRawDeposit - totalCommonExpenseShare
      const balance = netDeposit - cost

      return {
        userId: user.id,
        name: user.name,
        totalWeight,
        mealCount,
        cost,
        deposit: netDeposit,
        rawDeposit: totalRawDeposit,
        commonExpense: totalCommonExpenseShare,
        balance,
        depositRecord: userDepositRecord
      }
    })

    return summaries.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, mealCosts, mealRate, mealDeposits, commonExpenses])

  const totalDepositSum = userSummaries.reduce((sum, u) => sum + u.deposit, 0)
  const totalBalanceSum = userSummaries.reduce((sum, u) => sum + u.balance, 0)

  // --- Daily Meal Matrix Preparation ---
  // Get all unique dates from mealCosts (which tracks actual attendance)
  const uniqueDates = useMemo(() => {
    if (!mealCosts) return []
    const dates = new Set(mealCosts.map(m => m.meal_date))
    return Array.from(dates).sort()
  }, [mealCosts])

  // Map: Date -> UserId -> { Lunch: weight, Dinner: weight }
  const dailyAttendance = useMemo(() => {
    const map: Record<string, Record<string, { lunch: number, dinner: number }>> = {}
    if (!mealCosts) return map

    mealCosts.forEach(meal => {
        if (!map[meal.meal_date]) map[meal.meal_date] = {}
        if (!map[meal.meal_date][meal.user_id]) map[meal.meal_date][meal.user_id] = { lunch: 0, dinner: 0 }
        
        const weight = Number(meal.meal_weight) || 0

        if (meal.meal_type === 'Lunch') map[meal.meal_date][meal.user_id].lunch = weight
        if (meal.meal_type === 'Dinner') map[meal.meal_date][meal.user_id].dinner = weight
    })
    return map
  }, [mealCosts])


  const FIXED_UTILITIES = [
    'House Rent',
    'Guard',
    'Service Charge',
    'WiFi Bill',
    'Line Gas Bill',
    'Bua',
    'Cylinder',
    'Electricity'
  ]

  // --- Utility Matrix Preparation ---
  // We needed a transposed view: Rows = Utilities, Cols = Users
  const utilityMatrix = useMemo(() => {
     // UserID -> UtilityType -> Amount
     const map: Record<string, Record<string, number>> = {} 
     if (!utilityCollections) return map

     utilityCollections.forEach(col => {
         if (!map[col.user_id]) map[col.user_id] = {}
         map[col.user_id][col.utility_type] = Number(col.amount)
     })
     return map
  }, [utilityCollections])

  // Helper to get total collected for a specific utility type across all users
  const getUtilityCollectedTotal = (utilityType: string) => {
    let total = 0
    userSummaries.forEach(u => {
        total += utilityMatrix[u.userId]?.[utilityType] || 0
    })
    return total
  }

  // Helper to get total paid by a user across all these fixed utilities
  const getUserUtilityTotal = (userId: string) => {
    let total = 0
    FIXED_UTILITIES.forEach(ut => {
        total += utilityMatrix[userId]?.[ut] || 0
    })
    return total
  }

  // Grand total of all collections
  const totalUtilityCollections = FIXED_UTILITIES.reduce((sum, ut) => sum + getUtilityCollectedTotal(ut), 0)


  return (
    <div ref={ref} className="bg-white text-black w-[794px] mx-auto print:mx-0 print:w-full">
        
        {/* --- PAGE 1: SUMMARY & DEPOSITS --- */}
        <div className="p-8 relative flex flex-col min-h-[1050px]">
            {/* Header */}
            <div className="mb-8 border-b-2 border-teal-600 pb-4">
                <h1 className="text-3xl font-bold text-teal-700 uppercase tracking-widest text-center">Banasree Flat Manager Report</h1>
                <p className="text-center text-gray-500 font-medium mt-2">{monthLabel}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 border rounded-lg bg-teal-50">
                    <p className="text-xs font-bold text-teal-600 uppercase">Total Shopping</p>
                    <p className="text-2xl font-bold">৳{totalBajar.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg bg-orange-50">
                    <p className="text-xs font-bold text-orange-600 uppercase">Total Weight</p>
                    <p className="text-2xl font-bold">{totalMealWeight}</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-xs font-bold text-blue-600 uppercase">Meal Rate</p>
                    <p className="text-2xl font-bold">৳{mealRate.toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-purple-50">
                    <p className="text-xs font-bold text-purple-600 uppercase">Common Exp.</p>
                    <p className="text-2xl font-bold">৳{commonExpenses?.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Main Financial Table */}
            <div className="mb-4">
                <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Financial Summary</h3>
                <div className="rounded-lg border overflow-hidden">
                    <Table className="text-xs">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold text-black border-r">Name</TableHead>
                                <TableHead className="font-bold text-black text-center border-r">Weight</TableHead>
                                <TableHead className="font-bold text-black text-right border-r">Cost</TableHead>
                                <TableHead className="font-bold text-black text-right border-r">Deposits</TableHead>
                                <TableHead className="font-bold text-black text-right border-r">Common</TableHead>
                                <TableHead className="font-bold text-black text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userSummaries.map((u, i) => (
                                <TableRow key={u.userId} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                    <TableCell className="font-bold border-r py-2">{u.name}</TableCell>
                                    <TableCell className="text-center border-r py-2">{u.totalWeight}</TableCell>
                                    <TableCell className="text-right border-r py-2">৳{u.cost.toFixed(1)}</TableCell>
                                    <TableCell className="text-right border-r py-2">৳{u.rawDeposit.toFixed(0)}</TableCell>
                                    <TableCell className="text-right border-r py-2">-৳{u.commonExpense.toFixed(0)}</TableCell>
                                    <TableCell className={cn("text-right font-bold py-2", u.balance >= 0 ? "text-green-700" : "text-red-600")}>
                                        ৳{u.balance.toFixed(0)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableHeader className="bg-gray-800 text-white">
                            <TableRow>
                                <TableHead className="font-bold text-white border-r">TOTAL</TableHead>
                                <TableHead className="font-bold text-white text-center border-r">{totalMealWeight}</TableHead>
                                <TableHead className="font-bold text-white text-right border-r">৳{totalBajar.toLocaleString()}</TableHead>
                                <TableHead className="font-bold text-white text-right border-r">৳{userSummaries.reduce((s, u)=>s+u.rawDeposit, 0).toLocaleString()}</TableHead>
                                <TableHead className="font-bold text-white text-right border-r">৳{userSummaries.reduce((s, u)=>s+u.commonExpense, 0).toLocaleString()}</TableHead>
                                <TableHead className="font-bold text-white text-right">৳{totalBalanceSum.toLocaleString()}</TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>
                </div>
            </div>

             {/* Detailed Deposit Table Breakdown */}
             <div className="flex-1">
                <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Deposit Breakdown</h3>
                <div className="rounded-lg border overflow-hidden mb-4">
                    <Table className="text-[10px]">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold text-black border-r">Name</TableHead>
                                <TableHead className="text-center border-r">CF</TableHead>
                                {[1,2,3,4,5,6,7,8].map(d => (
                                    <TableHead key={d} className="text-center border-r">D{d}</TableHead>
                                ))}
                                <TableHead className="font-bold text-black text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {userSummaries.map((u, i) => (
                                <TableRow key={u.userId} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                    <TableCell className="font-medium border-r py-1.5">{u.name}</TableCell>
                                    <TableCell className="text-center border-r py-1.5 text-gray-500">{u.depositRecord?.carry_forward || '-'}</TableCell>
                                    {[1,2,3,4,5,6,7,8].map(d => {
                                        // @ts-ignore
                                        const val = u.depositRecord?.[`d${d}`]
                                        return (
                                            <TableCell key={d} className="text-center border-r py-1.5">{val || '-'}</TableCell>
                                        )
                                    })}
                                    <TableCell className="text-right font-bold py-1.5">৳{u.rawDeposit}</TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
             </div>
             
             {/* Footer Step */}
             <div className="text-center text-[10px] text-gray-400 mt-2">Page 1</div>
        </div>

        {/* --- PAGE 2: BAJAR, COMMON, UTILITY (Stacked) --- */}
        <div className="p-8 min-h-[1050px] relative flex flex-col gap-8 break-before-page">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Shopping & Expenses</h2>

            {/* Bajar List */}
            <div className="flex flex-col">
                <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Daily Bajar List</h3>
                <div className="rounded-lg border overflow-hidden">
                        <Table className="text-xs">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold text-black w-20">Date</TableHead>
                                <TableHead className="font-bold text-black">Item</TableHead>
                                <TableHead className="font-bold text-black text-right w-20">Cost</TableHead>
                                <TableHead className="font-bold text-black w-24 text-right pr-4">Buyer</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bajarItems?.map((item, i) => (
                                <TableRow key={item.id} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                    <TableCell className="py-2 text-gray-600">{new Date(item.purchase_date).getDate()}</TableCell>
                                    <TableCell className="py-2 font-medium">{item.item_name}</TableCell>
                                    <TableCell className="py-2 text-right">৳{item.cost}</TableCell>
                                    <TableCell className="py-2 text-right pr-4 text-gray-500 text-[10px]">{item.user?.name}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-gray-100 font-bold">
                                <TableCell colSpan={2} className="text-right pr-4">Total</TableCell>
                                <TableCell className="text-right">৳{totalBajar}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Common Expenses */}
            <div className="flex flex-col">
                <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Common Expenses</h3>
                <div className="rounded-lg border overflow-hidden">
                        <Table className="text-xs">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold text-black">Description</TableHead>
                                <TableHead className="font-bold text-black text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commonExpenses?.map((e, i) => (
                                <TableRow key={e.id} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                    <TableCell className="py-2">{e.description}</TableCell>
                                    <TableCell className="py-2 text-right">৳{e.amount}</TableCell>
                                </TableRow>
                            ))}
                                <TableRow className="bg-gray-100 font-bold">
                                <TableCell className="text-right pr-4">Total</TableCell>
                                <TableCell className="text-right">৳{commonExpenses?.reduce((s, e)=>s+Number(e.amount), 0)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Utilities Section */}
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Utility Costs</h3>
                    <div className="rounded-lg border overflow-hidden">
                        <Table className="text-xs">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold text-black">Utility Name</TableHead>
                                <TableHead className="font-bold text-black text-right">Total Bill</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {FIXED_UTILITIES.map((ut, i) => {
                                const expense = utilityExpenses?.find(u => u.expense_type === ut)
                                const amount = expense ? Number(expense.amount) : 0
                                return (
                                    <TableRow key={ut} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                        <TableCell className="py-2">{ut}</TableCell>
                                        <TableCell className="py-2 text-right">৳{amount}</TableCell>
                                    </TableRow>
                                )
                            })}
                            <TableRow className="bg-gray-100 font-bold">
                                <TableCell className="text-right pr-4">Total</TableCell>
                                <TableCell className="text-right">৳{utilityExpenses?.reduce((s, u)=>s+Number(u.amount), 0)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    </div>
                </div>

                {/* Utility Deposits Breakdown (Standard Style) */}
                 <div className="break-inside-avoid pt-6">
                    <h3 className="text-sm font-bold uppercase mb-2 text-gray-600">Utility Deposits</h3>
                    <div className="rounded-lg border overflow-hidden">
                        <Table className="text-[10px]">
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="font-bold text-black border-r border-gray-200">Expense Type</TableHead>
                                    {userSummaries.map(u => (
                                        <TableHead key={u.userId} className="text-center font-bold text-black border-r border-gray-200 px-1">
                                            {u.name.split(' ')[0]}
                                        </TableHead>
                                    ))}
                                    <TableHead className="font-bold text-black text-right">Collected</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {FIXED_UTILITIES.map((ut, i) => {
                                    const totalCollected = getUtilityCollectedTotal(ut)
                                    return (
                                        <TableRow key={ut} className={cn("border-b border-gray-200", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                            <TableCell className="font-bold text-gray-700 border-r border-gray-200 py-1.5">{ut}</TableCell>
                                            {userSummaries.map(u => {
                                                const val = utilityMatrix[u.userId]?.[ut] || 0
                                                return (
                                                    <TableCell key={u.userId} className="text-center text-gray-500 border-r border-gray-200 py-1.5">
                                                        {val > 0 ? val : '-'}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className="text-right font-bold text-gray-700 py-1.5">
                                                {totalCollected > 0 ? totalCollected.toLocaleString() : '0'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                 <TableRow className="bg-gray-800 text-white font-bold">
                                    <TableCell className="border-r border-gray-600">Total</TableCell>
                                     {userSummaries.map(u => {
                                         const userTotal = getUserUtilityTotal(u.userId)
                                         return <TableCell key={u.userId} className="text-center border-r border-gray-600 px-1">{userTotal}</TableCell>
                                     })}
                                     <TableCell className="text-right">
                                        {totalUtilityCollections.toLocaleString()}
                                     </TableCell>
                                 </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                 </div>
            </div>
            
            {/* Daily Meal Attendance (Now contiguous) */}
            <div className="flex flex-col gap-4 mt-8">
                <h2 className="text-xl font-bold border-b pb-2">Daily Meal Attendance</h2>
                <div className="rounded-lg border overflow-hidden">
                    <Table className="text-[10px]">
                    <TableHeader className="bg-gray-100">
                        <TableRow>
                        <TableHead className="font-bold text-black w-12 text-center border-r">Date</TableHead>
                        {userSummaries.map(u => (
                            <TableHead key={u.userId} className="font-bold text-black text-center border-r px-1 min-w-[40px]">
                            {u.name.split(' ')[0]} {/* First name only */}
                            </TableHead>
                        ))}
                        <TableHead className="font-bold text-black text-center bg-gray-200">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {uniqueDates.map((date, i) => {
                        const day = new Date(date).getDate();
                        let daysTotal = 0;
                        return (
                            <TableRow key={date} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                            <TableCell className="font-bold text-center border-r py-1 bg-gray-50">{day}</TableCell>
                            {userSummaries.map(u => {
                                const record = dailyAttendance[date]?.[u.userId];
                                const lunch = record?.lunch || 0;
                                const dinner = record?.dinner || 0;
                                const total = lunch + dinner;
                                daysTotal += total;
                                return (
                                <TableCell key={u.userId} className="text-center border-r py-1 px-1">
                                    {total > 0 ? (
                                    <div className="flex justify-center gap-1">
                                        <span className={lunch > 0 ? "font-bold text-black" : "text-gray-300"}>{lunch}</span>
                                        <span className="text-gray-300">/</span>
                                        <span className={dinner > 0 ? "font-bold text-black" : "text-gray-300"}>{dinner}</span>
                                    </div>
                                    ) : (
                                    <span className="text-gray-200">-</span>
                                    )}
                                </TableCell>
                                );
                            })}
                            <TableCell className="font-bold text-center bg-gray-100">{daysTotal}</TableCell>
                            </TableRow>
                        );
                        })}
                        <TableRow className="bg-gray-800 text-white font-bold">
                        <TableCell className="text-center border-r">TOT</TableCell>
                        {userSummaries.map(u => (
                            <TableCell key={u.userId} className="text-center border-r px-1">{u.totalWeight}</TableCell>
                        ))}
                        <TableCell className="text-center">{totalMealWeight}</TableCell>
                        </TableRow>
                    </TableBody>
                    </Table>
                </div>
                <div className="mt-2 text-xs text-gray-500">Key: Lunch / Dinner weight. (0 = no meal)</div>
            </div>
            
        </div>
    </div>
  )
})

MonthlyReport.displayName = 'MonthlyReport'
