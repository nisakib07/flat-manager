'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { batchUpdateUtilities, type UtilityUpdate } from '../actions'
import type { User, UtilityCollection, UtilityExpense, ActivityLog } from '@/types/database'
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
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Save, Loader2, Info } from 'lucide-react'
import MonthSelector from '@/components/MonthSelector'

interface UtilityGridProps {
  users: User[]
  utilityCollections: UtilityCollection[]
  utilityExpenses: UtilityExpense[]
  isAdmin: boolean
  selectedMonth: string
  activityLog: (ActivityLog & { actor?: { name: string } | null; target?: { name: string } | null })[]
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
  selectedMonth,
  activityLog
}: UtilityGridProps) {
  const [isPending, startTransition] = useTransition()
  
  // Activity log popup state
  const [showActivityLog, setShowActivityLog] = useState(false)
  
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
    
    // Get original value
    let originalValue = 0
    if (type === 'collection') {
      originalValue = utilityCollections.find(c => c.utility_type === utility && c.user_id === userId)?.amount || 0
    } else {
      originalValue = utilityExpenses.find(e => e.expense_type === utility)?.amount || 0
    }

    // Update edits state
    setEdits(prev => {
      const newEdits = { ...prev }
      
      // If amount equals original, remove from edits
      if (amount === originalValue) {
        delete newEdits[key]
      } else {
        // Otherwise store/update the edit
        newEdits[key] = {
          type,
          month: selectedMonth,
          utilityType: utility,
          userId,
          amount
        }
      }
      
      return newEdits
    })
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
        toast.error('Failed to save: ' + result.error)
      } else {
        setEdits({})
        setInputValues({})
        setActiveCell(null)
        toast.success('Utilities saved successfully!')
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

  // Keyboard Shortcuts: Ctrl+S to Save
  useKeyboardShortcuts({
    onSave: handleSaveAll,
    enabled: isAdmin && hasChanges
  })

  return (
    <div className="space-y-4 animate-fadeIn pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">⚡ Utilities</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Bills & collections</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActivityLog(true)}
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Log
            </button>
            <MonthSelector selectedMonth={selectedMonth} />
          </div>
        </div>
      
        {/* Admin Hint */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border border-orange-200 dark:border-orange-800/50">
            <Info className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Admin Mode: Click on cells to edit values</span>
            <span className="sm:hidden">Tap cells to edit</span>
          </div>
        )}
      </div>

      {/* Unified Table View for Mobile & Desktop */}
      <Card className="shadow-md border-teal-100 dark:border-teal-900/50 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] sm:max-h-none">
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

      {/* Activity Log Popup */}
      <Sheet open={showActivityLog} onOpenChange={setShowActivityLog}>
        <SheetContent side="responsive" className="h-[90vh] sm:h-auto sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="pb-3 border-b border-border/50 flex-shrink-0">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold">
                <span className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-sm">📋</span>
                Activity Log
              </span>
              <Badge variant="secondary" className="text-[11px] font-medium">
                {activityLog.length} entries
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pb-4">
            {activityLog.length > 0 ? (
              activityLog.map((log) => {
                const details = log.details as Record<string, unknown>
                const utility = String(details.utility || 'Unknown')
                const amount = Number(details.amount || 0)
                const type = String(details.type || '')
                const isCollection = type === 'collection'
                
                return (
                  <div key={log.id} className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                    {/* Who + Utility type */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-semibold">{log.actor?.name || 'Unknown'}</span>
                        <span className="text-muted-foreground">set</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{utility}</Badge>
                      </div>
                      <Badge className={cn(
                        "text-[10px] px-1.5 py-0 h-5",
                        isCollection 
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400" 
                          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      )}>
                        {isCollection ? 'Collection' : 'Bill'}
                      </Badge>
                    </div>
                    {/* Amount + target + timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCollection && log.target?.name && (
                          <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">for {log.target.name}</span>
                        )}
                        <span className={cn("text-sm font-bold tabular-nums", isCollection ? "text-teal-600 dark:text-teal-400" : "text-green-600 dark:text-green-400")}>
                          ৳{amount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 text-2xl">📋</div>
                <p className="text-sm font-medium text-muted-foreground">No activity recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Changes will appear here when utilities are updated</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
