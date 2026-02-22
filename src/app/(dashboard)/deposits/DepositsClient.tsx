'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { updateDepositSlot } from '../actions'
import type { User, MealDeposit, ActivityLog } from '@/types/database'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Save, RotateCcw, Plus } from 'lucide-react'
import MonthSelector from '@/components/MonthSelector'

interface DepositsClientProps {
  users: User[]
  deposits: (MealDeposit & { user?: { name: string } })[]
  isAdmin: boolean
  currentUserId: string
  selectedMonth: string
  activityLog: (ActivityLog & { actor?: { name: string } | null; target?: { name: string } | null })[]
}

type DepositField = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'carry_forward'

interface DepositUpdate {
  userId: string
  field: DepositField
  value: number
}

// Quick preset amounts
const QUICK_AMOUNTS = [1000, 2000, 3000, 5000]

export default function DepositsClient({ users, deposits, isAdmin, currentUserId, selectedMonth, activityLog }: DepositsClientProps) {
  const [isPending, startTransition] = useTransition()
  
  // Activity log popup state
  const [showActivityLog, setShowActivityLog] = useState(false)
  
  // Batch save pattern - track local edits
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({})
  
  // Quick add modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddUserId, setQuickAddUserId] = useState<string>('')
  const [quickAddAmount, setQuickAddAmount] = useState('')
  
  // Get the key for a specific cell
  const getKey = (userId: string, field: DepositField) => `${userId}::${field}`
  
  // Get server value for a cell
  const getServerValue = useCallback((userId: string, field: DepositField): number => {
    const deposit = deposits.find(d => d.user_id === userId)
    if (!deposit) return 0
    return Number(deposit[field as keyof MealDeposit]) || 0
  }, [deposits])

  // Get current value (pending or server)
  const getValue = useCallback((userId: string, field: DepositField): number => {
    const key = getKey(userId, field)
    if (key in pendingChanges) {
      return pendingChanges[key]
    }
    return getServerValue(userId, field)
  }, [pendingChanges, getServerValue])

  // Update pending change
  const updatePendingChange = useCallback((userId: string, field: DepositField, value: number) => {
    const key = getKey(userId, field)
    const serverValue = getServerValue(userId, field)
    
    setPendingChanges(prev => {
      const updated = { ...prev }
      if (value === serverValue) {
        delete updated[key]
      } else {
        updated[key] = value
      }
      return updated
    })
  }, [getServerValue])

  // Handle input blur - save to pending
  const handleBlur = (userId: string, field: DepositField, value: string) => {
    const numValue = Number(value) || 0
    updatePendingChange(userId, field, numValue)
  }

  // Find the first empty slot for a user
  const findEmptySlot = (userId: string): DepositField | null => {
    const slots: DepositField[] = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8']
    for (const slot of slots) {
      if (getValue(userId, slot) === 0) {
        return slot
      }
    }
    return null
  }
  
  // Quick add deposit
  const handleQuickAdd = (amount: number) => {
    if (!quickAddUserId) return
    
    const emptySlot = findEmptySlot(quickAddUserId)
    if (!emptySlot) {
      toast.error('All deposit slots are full!')
      return
    }
    
    updatePendingChange(quickAddUserId, emptySlot, amount)
    toast.success(`Added ৳${amount} to ${emptySlot.toUpperCase()}`)
    setShowQuickAdd(false)
    setQuickAddAmount('')
  }

  // Handle custom amount
  const handleCustomAmount = () => {
    const amount = Number(quickAddAmount)
    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    handleQuickAdd(amount)
  }

  // Open quick add modal
  const openQuickAdd = (userId: string) => {
    setQuickAddUserId(userId)
    setQuickAddAmount('')
    setShowQuickAdd(true)
  }
  
  // Save all changes
  const handleSaveAll = async () => {
    if (Object.keys(pendingChanges).length === 0) return
    
    startTransition(async () => {
      const updates: DepositUpdate[] = Object.entries(pendingChanges).map(([key, value]) => {
        const [userId, field] = key.split('::') as [string, DepositField]
        return { userId, field, value }
      })

      // Execute all updates
      const results = await Promise.all(
        updates.map(u => updateDepositSlot(u.userId, selectedMonth, u.field, u.value))
      )
      
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        toast.error('Some updates failed: ' + errors.map(e => e.error).join(', '))
      } else {
        toast.success('Deposits saved successfully!')
        setPendingChanges({})
      }
    })
  }
  
  // Reset changes
  const handleReset = () => {
    if (confirm('Discard all unsaved changes?')) {
      setPendingChanges({})
    }
  }
  
  // Check for changes
  const hasChanges = Object.keys(pendingChanges).length > 0
  const changesCount = Object.keys(pendingChanges).length

  // Keyboard Shortcuts: Ctrl+S to Save
  useKeyboardShortcuts({
    onSave: handleSaveAll,
    onCancel: handleReset,
    enabled: isAdmin && hasChanges
  })
  
  // Calculate row total (with pending changes)
  const getRowTotal = (userId: string): number => {
    const fields: DepositField[] = ['carry_forward', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8']
    return fields.reduce((sum, field) => sum + getValue(userId, field), 0)
  }

  // Calculate grand total (with pending changes)
  const getTotalDeposits = (): number => {
    return users.reduce((sum, user) => sum + getRowTotal(user.id), 0)
  }

   return (
    <div className="space-y-4 animate-fadeIn pb-20">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">💰 Deposits</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Meal deposits</p>
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
        
        {/* Total Collected Badge */}
        <div className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/30 px-4 py-2.5 rounded-xl border border-teal-100 dark:border-teal-800">
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Total Collected</span>
          <span className="text-lg font-black text-teal-900 dark:text-teal-100">৳{getTotalDeposits().toLocaleString()}</span>
        </div>
      </div>

      <Card className="shadow-md border-teal-100 dark:border-teal-900/50 bg-transparent sm:bg-card border-none sm:border">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[70vh] sm:max-h-none">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-teal-50/50 dark:bg-teal-950/20 sticky top-0 z-20">
              <TableRow>
                <TableHead className="w-[150px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Name</TableHead>
                <TableHead className="text-center w-[118px] font-bold text-orange-600 dark:text-orange-400 uppercase text-xs tracking-wider bg-orange-50/50 dark:bg-orange-900/10">C/F</TableHead>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <TableHead key={i} className="text-center w-[118px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">
                    D{i}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[125px] font-bold text-teal-900 dark:text-teal-100 uppercase text-xs tracking-wider bg-teal-100/30 dark:bg-teal-900/10">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const canEdit = isAdmin; 

                return (
                  <TableRow key={`${user.id}-${selectedMonth}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2">
                          {user.name}
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
                              onClick={() => openQuickAdd(user.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                    </TableCell>
                    <TableCell className="p-1.5 bg-orange-50/10 dark:bg-orange-900/5">
                        <Input 
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="1"
                            disabled={!canEdit}
                            defaultValue={getValue(user.id, 'carry_forward') || ''}
                            placeholder="0"
                            className={cn(
                              "text-center h-10 w-full min-w-[82px] border-orange-100 focus-visible:ring-orange-400 bg-transparent font-medium text-orange-700 dark:text-orange-400",
                              getKey(user.id, 'carry_forward') in pendingChanges && "ring-2 ring-primary ring-offset-1"
                            )}
                            onBlur={(e) => handleBlur(user.id, 'carry_forward', e.target.value)}
                        />
                    </TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                        const field = `d${i}` as DepositField
                        const hasPending = getKey(user.id, field) in pendingChanges
                        return (
                            <TableCell key={i} className="p-1.5">
                                <Input 
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="1"
                                    className={cn(
                                      "text-center h-10 w-full border-transparent hover:border-teal-100 focus:border-teal-400 focus-visible:ring-teal-400 bg-transparent",
                                      hasPending && "ring-2 ring-primary ring-offset-1"
                                    )}
                                    placeholder="-"
                                    disabled={!canEdit}
                                    defaultValue={getValue(user.id, field) || ''}
                                    onBlur={(e) => handleBlur(user.id, field, e.target.value)}
                                />
                            </TableCell>
                        )
                    })}
                    <TableCell className="text-right font-black text-teal-700 dark:text-teal-300 bg-teal-50/30 dark:bg-teal-900/5 px-3 py-2 text-base">
                        ৳{getRowTotal(user.id).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 p-2">
          {users.map((user) => {
            const canEdit = isAdmin
            const rowTotal = getRowTotal(user.id)
            
            return (
              <div key={`mobile-${user.id}`} className="bg-card border rounded-xl p-3 space-y-3">
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{user.name}</span>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
                        onClick={() => openQuickAdd(user.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold">
                    ৳{rowTotal.toLocaleString()}
                  </Badge>
                </div>
                
                {/* Carry Forward */}
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 w-16">C/F:</span>
                  <Input 
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    disabled={!canEdit}
                    defaultValue={getValue(user.id, 'carry_forward') || ''}
                    placeholder="0"
                    className={cn(
                      "h-8 text-center border-orange-200 bg-white dark:bg-slate-900 font-medium flex-1",
                      getKey(user.id, 'carry_forward') in pendingChanges && "ring-2 ring-primary"
                    )}
                    onBlur={(e) => handleBlur(user.id, 'carry_forward', e.target.value)}
                  />
                </div>
                
                {/* Deposit Grid - 4x2 */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                    const field = `d${i}` as DepositField
                    const hasPending = getKey(user.id, field) in pendingChanges
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[10px] font-medium text-muted-foreground mb-0.5">D{i}</span>
                        <Input 
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="1"
                          className={cn(
                            "text-center h-9 text-sm border-muted bg-muted/30",
                            hasPending && "ring-2 ring-primary"
                          )}
                          placeholder="-"
                          disabled={!canEdit}
                          defaultValue={getValue(user.id, field) || ''}
                          onBlur={(e) => handleBlur(user.id, field, e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      
      {!isAdmin && (
         <p className="text-xs text-muted-foreground text-right italic">
            * Only administrators can record deposits.
         </p>
      )}

      {/* Quick Add Modal */}
      <Sheet open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <SheetContent side="responsive" className="h-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Quick Add Deposit</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adding deposit for: <span className="font-semibold text-foreground">{users.find(u => u.id === quickAddUserId)?.name}</span>
            </p>
            
            {/* Quick amount buttons */}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-12 text-lg font-bold hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                  onClick={() => handleQuickAdd(amount)}
                >
                  ৳{amount.toLocaleString()}
                </Button>
              ))}
            </div>
            
            {/* Custom amount */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Or enter custom amount:</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter amount..."
                  value={quickAddAmount}
                  onChange={(e) => setQuickAddAmount(e.target.value)}
                  className="flex-1 text-lg"
                />
                <Button onClick={handleCustomAmount} className="bg-teal-600 hover:bg-teal-700">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Save Changes Bar - Only show when there are actual changes */}
      {isAdmin && hasChanges && (
        <div className="fixed bottom-20 sm:bottom-8 left-0 right-0 z-50 px-3 sm:px-4 animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto py-3 px-4 rounded-xl border bg-background/95 backdrop-blur shadow-xl flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{changesCount} unsaved change{changesCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleReset}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Discard
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveAll}
                disabled={isPending}
                className="font-semibold bg-teal-600 hover:bg-teal-700"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Popup */}
      <Sheet open={showActivityLog} onOpenChange={setShowActivityLog}>
        <SheetContent side="responsive" className="h-[90vh] sm:h-auto sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="pb-3 border-b border-border/50 flex-shrink-0">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold">
                <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-sm">📋</span>
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
                const field = String(details.field || '').toUpperCase()
                const oldVal = Number(details.old_value || 0)
                const newVal = Number(details.new_value || 0)
                
                return (
                  <div key={log.id} className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                    {/* Who → For whom */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-semibold">{log.actor?.name || 'Unknown'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-teal-700 dark:text-teal-400">{log.target?.name || 'Unknown'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono h-5">{field}</Badge>
                    </div>
                    {/* Value change + timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground tabular-nums">৳{oldVal.toLocaleString()}</span>
                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className={cn("text-sm font-bold tabular-nums", newVal > oldVal ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                          ৳{newVal.toLocaleString()}
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
                <p className="text-xs text-muted-foreground mt-1">Changes will appear here when deposits are updated</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
