'use client'

import { useState, useTransition } from 'react'
import { batchUpdateUtilities, type UtilityUpdate } from '../actions'
import type { User, UtilityCollection, UtilityExpense } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Save, Loader2, Info } from 'lucide-react'

interface UtilityGridProps {
  users: User[]
  utilityCollections: UtilityCollection[]
  utilityExpenses: UtilityExpense[]
  isAdmin: boolean
  selectedMonth: string
}

const UTILITY_TYPES = [
  'House Rent',
  'Guard',
  'Service Charge',
  'WiFi Bill',
  'Line Gas Bill',
  'Bua',
  'Cylinder',
  'Electricity'
]

export default function UtilityGrid({ 
  users, 
  utilityCollections, 
  utilityExpenses, 
  isAdmin,
  selectedMonth 
}: UtilityGridProps) {
  const [isPending, startTransition] = useTransition()
  
  // Track edits: Key -> UtilityUpdate object
  const [edits, setEdits] = useState<Record<string, UtilityUpdate>>({})
  
  // Track UI state for inputs (so they don't jump around)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  const [activeCell, setActiveCell] = useState<string | null>(null)

  const getKey = (type: 'collection' | 'bill', utility: string, userId?: string) => {
    return type === 'collection' ? `${utility}::${userId}` : `BILL::${utility}`
  }

  // Get current value (either from edits or from props)
  const getValue = (type: 'collection' | 'bill', utility: string, userId?: string) => {
    const key = getKey(type, utility, userId)
    
    // If editing, return input value
    if (activeCell === key && inputValues[key] !== undefined) {
      return inputValues[key]
    }
    
    // If we have an unsaved edit, return that amount
    if (edits[key]) {
      return edits[key].amount
    }

    // Otherwise return DB value
    if (type === 'collection') {
      return utilityCollections.find(c => c.utility_type === utility && c.user_id === userId)?.amount || 0
    } else {
      return utilityExpenses.find(e => e.expense_type === utility)?.amount || 0
    }
  }

  const handleCellClick = (key: string, value: number) => {
    if (!isAdmin) return
    setActiveCell(key)
    setInputValues(prev => ({ ...prev, [key]: value.toString() }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'collection' | 'bill', utility: string, userId?: string) => {
    const val = e.target.value
    const key = getKey(type, utility, userId)
    
    setInputValues(prev => ({ ...prev, [key]: val }))

    const amount = parseFloat(val) || 0
    
    setEdits(prev => ({
      ...prev,
      [key]: {
        type,
        month: selectedMonth,
        utilityType: utility,
        userId,
        amount
      }
    }))
  }

  const handleBlur = () => {
    setActiveCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setActiveCell(null)
    }
  }

  const handleSaveAll = () => {
    if (Object.keys(edits).length === 0) return

    startTransition(async () => {
      const updates = Object.values(edits)
      const result = await batchUpdateUtilities(updates)
      
      if (result.error) {
        alert('⚠️ Failed to save: ' + result.error)
      } else {
        setEdits({})
        setInputValues({})
        setActiveCell(null)
      }
    })
  }

  // Calculate Totals (considering edits)
  const getEffectiveCollection = (utility: string, userId: string) => {
    const key = getKey('collection', utility, userId)
    return edits[key] ? edits[key].amount : (utilityCollections.find(c => c.utility_type === utility && c.user_id === userId)?.amount || 0)
  }

  const getEffectiveBill = (utility: string) => {
    const key = getKey('bill', utility)
    return edits[key] ? edits[key].amount : (utilityExpenses.find(e => e.expense_type === utility)?.amount || 0)
  }

  const getTotalCollected = (utility: string) => {
    return users.reduce((sum, user) => sum + getEffectiveCollection(utility, user.id), 0)
  }

  // Aggregates
  const totalByRow = UTILITY_TYPES.reduce((acc, utility) => {
    acc.collected += getTotalCollected(utility)
    acc.paid += getEffectiveBill(utility)
    return acc
  }, { collected: 0, paid: 0 })

  const totalByUser = users.reduce((acc, user) => {
    acc[user.id] = UTILITY_TYPES.reduce((sum, utility) => sum + getEffectiveCollection(utility, user.id), 0)
    return acc
  }, {} as Record<string, number>)

  const hasChanges = Object.keys(edits).length > 0

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Utility Bill Tracking
          </h1>
          <p className="text-muted-foreground mt-1">Track all utility bills and collections</p>
        </div>
        {isAdmin && (
           <div className="hidden sm:flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-md text-sm font-medium border border-orange-200 dark:border-orange-800/50">
             <Info className="w-4 h-4" />
             Admin Mode: Click on cells to edit
           </div>
        )}
      </div>

      <Card className="shadow-md border-teal-100 dark:border-teal-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="relative border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-md">
              <TableRow className="bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-50/80 dark:hover:bg-teal-900/40 border-b-2 border-teal-100 dark:border-teal-900">
                <TableHead className="sticky left-0 z-30 bg-teal-50 dark:bg-teal-950/40 border-r border-teal-200 dark:border-teal-900 w-[150px] font-bold text-teal-900 dark:text-teal-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Expense Type
                </TableHead>
                {users.map(user => (
                  <TableHead key={user.id} className="text-center font-bold text-teal-900 dark:text-teal-100 min-w-[100px] border-r border-teal-100 dark:border-teal-900/50">
                    {user.name}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold text-orange-800 dark:text-orange-200 bg-orange-100/50 dark:bg-orange-900/20 border-r border-orange-200 dark:border-orange-800/50 min-w-[110px]">
                    Collected
                </TableHead>
                <TableHead className="text-center font-bold text-orange-800 dark:text-orange-200 bg-orange-100/50 dark:bg-orange-900/20 border-r border-orange-200 dark:border-orange-800/50 min-w-[110px]">
                    Paid Bill
                </TableHead>
                <TableHead className="text-center font-bold text-orange-800 dark:text-orange-200 bg-orange-100/50 dark:bg-orange-900/20 min-w-[110px]">
                    Remaining
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UTILITY_TYPES.map((utility, index) => {
                const collected = getTotalCollected(utility)
                const paid = getEffectiveBill(utility)
                const remaining = collected - paid
                
                const billKey = getKey('bill', utility)
                const isPaidEditing = activeCell === billKey

                return (
                  <TableRow key={utility} className={cn("hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-colors", index % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                    <TableCell className="sticky left-0 z-10 bg-background/95 backdrop-blur font-semibold text-teal-700 dark:text-teal-300 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {utility}
                    </TableCell>
                    
                    {/* User Columns */}
                    {users.map(user => {
                      const key = getKey('collection', utility, user.id)
                      const isEditing = activeCell === key
                      const amount = isEditing ? parseFloat(inputValues[key]) : getEffectiveCollection(utility, user.id)
                      const hasEdit = !!edits[key]

                      return (
                        <TableCell key={user.id} className={cn("p-0 border-r border-border/50 text-center relative", hasEdit && "bg-yellow-100/30 dark:bg-yellow-900/10")}>
                          {isEditing ? (
                            <Input
                              type="number"
                              inputMode="decimal"
                              className="w-full h-full border-0 rounded-none text-center bg-blue-50 dark:bg-blue-900/20 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500"
                              value={inputValues[key] || ''}
                              onChange={(e) => handleChange(e, 'collection', utility, user.id)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              onFocus={(e) => e.target.select()}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className={cn(
                                "w-full h-full py-3 px-2 flex items-center justify-center cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5",
                                amount > 0 ? "font-medium text-foreground" : "text-muted-foreground/30"
                              )}
                              onClick={() => handleCellClick(key, amount)}
                            >
                              {amount > 0 ? amount : '·'}
                            </div>
                          )}
                        </TableCell>
                      )
                    })}

                    {/* Manager Columns */}
                    <TableCell className="text-center font-bold text-orange-700 dark:text-orange-300 bg-orange-50/30 dark:bg-orange-950/10 border-r border-orange-100 dark:border-orange-900/30">
                      {collected.toLocaleString()}
                    </TableCell>
                    
                    <TableCell className={cn("p-0 border-r border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-950/10", edits[billKey] && "bg-green-100/30")}>
                       {isPaidEditing ? (
                            <Input
                              type="number"
                              inputMode="decimal"
                              className="w-full h-full border-0 rounded-none text-center bg-green-50 dark:bg-green-900/20 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-green-500 font-bold text-green-700"
                              value={inputValues[billKey] || ''}
                              onChange={(e) => handleChange(e, 'bill', utility)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              onFocus={(e) => e.target.select()}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="w-full h-full py-3 px-2 flex items-center justify-center cursor-pointer font-bold text-green-600 dark:text-green-400 hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors"
                              onClick={() => handleCellClick(billKey, paid)}
                            >
                              {paid > 0 ? paid.toLocaleString() : '0'}
                            </div>
                          )}
                    </TableCell>

                    <TableCell className={cn("text-center font-black bg-orange-50/30 dark:bg-orange-950/10", remaining < 0 ? 'text-red-500' : 'text-emerald-600')}>
                      {remaining.toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter className="bg-teal-100 dark:bg-teal-900/90 border-t-2 border-teal-200 dark:border-teal-800 sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
              <TableRow className="bg-teal-100 dark:bg-teal-900/90 hover:bg-teal-100 dark:hover:bg-teal-900/90">
                <TableCell className="sticky left-0 bg-teal-100 dark:bg-teal-900/90 border-r border-teal-200 dark:border-teal-800 font-bold text-teal-900 dark:text-teal-100 text-right shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    Total
                </TableCell>
                {users.map(user => (
                  <TableCell key={user.id} className="text-center font-bold text-teal-800 dark:text-teal-200 border-r border-teal-200 dark:border-teal-800">
                    {totalByUser[user.id]?.toLocaleString() || 0}
                  </TableCell>
                ))}
                <TableCell className="text-center font-black text-orange-800 dark:text-orange-200 border-r border-teal-200 dark:border-teal-800">{totalByRow.collected.toLocaleString()}</TableCell>
                <TableCell className="text-center font-black text-orange-800 dark:text-orange-200 border-r border-teal-200 dark:border-teal-800">{totalByRow.paid.toLocaleString()}</TableCell>
                <TableCell className={cn("text-center font-black", (totalByRow.collected - totalByRow.paid) < 0 ? 'text-red-600' : 'text-emerald-700')}>{(totalByRow.collected - totalByRow.paid).toLocaleString()}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={handleSaveAll}
            disabled={isPending}
            size="lg"
            className="rounded-full shadow-xl bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 h-14 border-4 border-white/20 dark:border-black/20 backdrop-blur-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes ({Object.keys(edits).length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
