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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Pencil, Trash2, Plus, Receipt } from 'lucide-react'

interface UserSubset {
    id: string;
    name: string;
}

interface CommonExpensesClientProps {
  expenses: CommonExpense[]
  isAdmin: boolean
  users: UserSubset[]
}

export default function CommonExpensesClient({ expenses, isAdmin, users }: CommonExpensesClientProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<CommonExpense | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      cost: '',
      month: new Date().toISOString().slice(0, 7) + '-01'
  })

  const openAddModal = () => {
      setEditingExpense(null)
      setFormData({
          name: '',
          cost: '',
          month: new Date().toISOString().slice(0, 7) + '-01'
      })
      setShowForm(true)
  }

  const openEditModal = (expense: CommonExpense) => {
      setEditingExpense(expense)
      setFormData({
          name: expense.expense_name,
          cost: String(expense.total_cost),
          month: expense.month
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Common Expenses
          </h1>
          <p className="text-muted-foreground mt-1">Shared items split equally among all flatmates.</p>
        </div>
        {isAdmin && (
          <Button onClick={openAddModal} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

        <Card className="shadow-md border-teal-100 dark:border-teal-900/50 overflow-hidden">
            <div className="overflow-x-auto">
                <Table className="table-fixed">
                    <TableHeader className="bg-teal-50/50 dark:bg-teal-950/20">
                        <TableRow>
                            <TableHead className="w-[180px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Item Description</TableHead>
                            <TableHead className="w-[120px] !text-right font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider bg-teal-100/30 dark:bg-teal-900/10">Total Cost</TableHead>
                            {users.map(user => (
                                <TableHead key={user.id} className="!text-right font-bold text-teal-600 dark:text-teal-500 uppercase text-xs tracking-wider min-w-[100px]">
                                    {user.name}
                                </TableHead>
                            ))}
                            {isAdmin && <TableHead className="w-[100px] !text-center font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Actions</TableHead>}
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
                                                    {new Date(expense.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-900/5">
                                        ৳{expense.total_cost}
                                    </TableCell>
                                    {users.map(user => (
                                        <TableCell key={user.id} className="text-right text-muted-foreground text-sm">
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
                                <TableCell key={user.id} className="text-right font-bold text-teal-600 dark:text-teal-400">
                                    ৳{perUserTotal.toFixed(2)}
                                </TableCell>
                            ))}
                            {isAdmin && <TableCell />}
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Common Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Item Description</Label>
                <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Handwash, WiFi Bill" 
                    required 
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="cost">Total Cost (৳)</Label>
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
             <div className="grid gap-2">
                <Label htmlFor="month">Month</Label>
                <Input 
                    id="month" 
                    type="date"
                    value={formData.month} 
                    onChange={e => setFormData({...formData, month: e.target.value})}
                    required 
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {isPending ? 'Saving...' : 'Save Expense'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
