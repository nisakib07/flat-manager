'use client'

import { useState, useTransition } from 'react'
import { addCommonExpense, deleteCommonExpense, updateCommonExpense } from '../actions'
import type { CommonExpense } from '@/types/database'
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Pencil, Trash2, Plus, Receipt } from 'lucide-react'
import MonthSelector from '@/components/MonthSelector'

interface UserSubset {
    id: string;
    name: string;
}

interface CommonExpenseWithShopper extends CommonExpense {
    shopper?: { name: string } | null
}

interface CommonExpensesClientProps {
  expenses: CommonExpenseWithShopper[]
  isAdmin: boolean
  users: UserSubset[]
  selectedMonth: string
}

export default function CommonExpensesClient({ expenses, isAdmin, users, selectedMonth }: CommonExpensesClientProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<CommonExpense | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      cost: '',
      month: new Date().toISOString().slice(0, 7) + '-01',
      shopper_id: '',
      payment_preference: 'deposit' as 'deposit' | 'payback'
  })

  const openAddModal = () => {
      setEditingExpense(null)
      setFormData({
          name: '',
          cost: '',
          month: selectedMonth,
          shopper_id: '',
          payment_preference: 'deposit'
      })
      setShowForm(true)
  }

  const openEditModal = (expense: CommonExpense) => {
      setEditingExpense(expense)
      setFormData({
          name: expense.expense_name,
          cost: String(expense.total_cost),
          month: expense.month,
          shopper_id: expense.shopper_id || '',
          payment_preference: expense.payment_preference || 'deposit'
      })
      setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
        const data = new FormData()
        data.append('expense_name', formData.name)
        data.append('total_cost', formData.cost)
        data.append('month', formData.month)
        data.append('shopper_id', formData.shopper_id)
        data.append('payment_preference', formData.payment_preference)

        if (editingExpense) {
            await updateCommonExpense(editingExpense.id, data)
        } else {
            await addCommonExpense(data)
        }
        setShowForm(false)
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    startTransition(async () => {
        await deleteCommonExpense(id)
    })
  }

  const totalCost = expenses.reduce((sum, exp) => sum + Number(exp.total_cost), 0)
  const perUserTotal = users.length > 0 ? totalCost / users.length : 0

  return (
    <div className="space-y-4 animate-fadeIn pb-20">
      {/* Header - Unified Layout */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">📋 Common Expenses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Shared costs</p>
        </div>
        <MonthSelector selectedMonth={selectedMonth} />
      </div>
      
      {/* Action Row */}
      {isAdmin && (
        <Button onClick={openAddModal} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-1" />
          Add Expense
        </Button>
      )}

      <Card className="shadow-md border-teal-100 dark:border-teal-900/50 bg-transparent sm:bg-card border-none sm:border">
          {/* Unified Table View for Mobile & Desktop */}
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] sm:max-h-none">
              <Table className="min-w-[800px]">
                  <TableHeader className="bg-teal-50/50 dark:bg-teal-950/20 sticky top-0 z-20">
                      <TableRow>
                          <TableHead className="w-[180px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Item Description</TableHead>
                          <TableHead className="w-[110px] !text-right font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider bg-teal-100/30 dark:bg-teal-900/10">Total Cost</TableHead>
                          {users.map(user => (
                              <TableHead key={user.id} className="!text-right font-bold text-teal-600 dark:text-teal-500 uppercase text-xs tracking-wider w-[110px] whitespace-nowrap">
                                  {user.name}
                              </TableHead>
                          ))}
                          {isAdmin && <TableHead className="w-[90px] !text-center font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Actions</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {expenses.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={2 + users.length + (isAdmin ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                                  No common expenses added yet.
                              </TableCell>
                          </TableRow>
                      ) : (
                          expenses.map((expense) => (
                              <TableRow key={expense.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                          <div className="p-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                                                <Receipt className="w-4 h-4" />
                                          </div>
                                          <div className="flex flex-col">
                                              <span>{expense.expense_name}</span>
                                              <span className="text-[10px] text-muted-foreground">
                                                  {new Date(expense.month).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                  {expense.shopper && <span className="ml-1 text-teal-600 dark:text-teal-400">• Bought by {expense.shopper.name}</span>}
                                              </span>
                                          </div>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-900/5">
                                      ৳{expense.total_cost}
                                  </TableCell>
                                  {users.map(user => (
                                      <TableCell key={user.id} className="text-right text-muted-foreground text-sm whitespace-nowrap px-3">
                                          ৳{expense.user_share.toFixed(2)}
                                      </TableCell>
                                  ))}
                                  {isAdmin && (
                                      <TableCell className="text-center">
                                          <div className="flex justify-center gap-1">
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(expense)}>
                                                  <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(expense.id)}>
                                                  <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                          </div>
                                      </TableCell>
                                  )}
                              </TableRow>
                          ))
                      )}
                  </TableBody>
                  <TableFooter className="bg-teal-50 dark:bg-teal-950/30 border-t-2 border-teal-100 dark:border-teal-900">
                      <TableRow>
                          <TableCell className="font-bold text-teal-800 dark:text-teal-200">Total</TableCell>
                          <TableCell className="text-right font-black text-teal-700 dark:text-teal-300 text-lg">৳{totalCost.toLocaleString()}</TableCell>
                          {users.map(user => (
                              <TableCell key={user.id} className="text-right font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap px-3">
                                  ৳{perUserTotal.toFixed(2)}
                              </TableCell>
                          ))}
                          {isAdmin && <TableCell />}
                      </TableRow>
                  </TableFooter>
              </Table>
          </div>
        </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="responsive" className="h-[85vh] sm:h-auto overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingExpense ? 'Edit Expense' : 'Add Common Expense'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Label htmlFor="name" className="mb-1 block">Item Description</Label>
                    <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Handwash, WiFi Bill" 
                        required 
                    />
                </div>
                 <div>
                    <Label htmlFor="cost" className="mb-1 block">Total Cost (৳)</Label>
                    <Input 
                        id="cost" 
                        type="number"
                        step="0.01"
                        value={formData.cost} 
                        onChange={e => setFormData({...formData, cost: e.target.value})}
                        placeholder="0.00" 
                        required 
                    />
                </div>
                 <div>
                    <Label htmlFor="month" className="mb-1 block">Month</Label>
                    <Input 
                        id="month" 
                        type="date"
                        value={formData.month} 
                        onChange={e => setFormData({...formData, month: e.target.value})}
                        required 
                    />
                </div>
                 <div className="sm:col-span-2">
                    <Label htmlFor="shopper" className="mb-1 block">Shopper (Who bought this?) <span className="text-red-500">*</span></Label>
                    <select 
                        id="shopper" 
                        value={formData.shopper_id} 
                        onChange={e => setFormData({...formData, shopper_id: e.target.value})}
                        required
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Select Shopper</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="sm:col-span-2 bg-muted/30 p-3 rounded-lg border border-dashed border-teal-200 dark:border-teal-900">
                    <Label className="mb-2 block">If expense exceeds shopper balance</Label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-transparent hover:border-teal-200 transition-all flex-1">
                            <input 
                                type="radio" 
                                name="payment_preference"
                                value="deposit"
                                checked={formData.payment_preference === 'deposit'}
                                onChange={() => setFormData({...formData, payment_preference: 'deposit'})}
                                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                            />
                            <span className="text-sm font-medium">Add to Meal Deposit</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-transparent hover:border-amber-200 transition-all flex-1">
                            <input 
                                type="radio" 
                                name="payment_preference"
                                value="payback"
                                checked={formData.payment_preference === 'payback'}
                                onChange={() => setFormData({...formData, payment_preference: 'payback'})}
                                className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium">Request Payback</span>
                        </label>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formData.payment_preference === 'deposit' 
                            ? 'Excess amount will be added to the shopper\'s meal deposit'
                            : 'Manager will owe the excess amount to the shopper'}
                    </p>
                </div>
            </div>
            <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white flex-1">
                    {isPending ? 'Saving...' : 'Save Expense'}
                </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Floating Action Button for Quick Add */}
      {isAdmin && !showForm && (
        <button
          onClick={openAddModal}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-lg z-40 flex items-center justify-center transition-all duration-200 sm:hidden"
          aria-label="Add expense"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </div>
  )
}
