'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { addBajarItem, deleteBajarItem, updateBajarItem, addFundTransfer, updateFundTransfer, deleteFundTransfer } from '../actions'
import { useRef } from 'react'
import MonthSelector from '@/components/MonthSelector'
import type { User, BajarItem, FundTransfer } from '@/types/database'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface ShoppingClientProps {
  users: Pick<User, 'id' | 'name'>[]
  items: (Pick<BajarItem, 'id' | 'item_name' | 'cost' | 'purchase_date' | 'user_id'> & { user: { name: string } | null })[]
  isAdmin: boolean
  managerBalance: number
  shopperBalances: Record<string, number>
  currentUserId: string
  selectedMonth: string
  transferLog: (FundTransfer & { shopper?: { name: string } | null })[]
}

export default function ShoppingClient({ 
  users, 
  items, 
  isAdmin, 
  managerBalance, 
  shopperBalances, 
  currentUserId,
  selectedMonth,
  transferLog: initialTransferLog
}: ShoppingClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<(Pick<BajarItem, 'id' | 'item_name' | 'cost' | 'purchase_date' | 'user_id'> & { user: { name: string } | null }) | null>(null)
  const [transferType, setTransferType] = useState<'give' | 'return'>('give')
  const [viewShopperId, setViewShopperId] = useState<string>(currentUserId)
  const [paymentPreference, setPaymentPreference] = useState<'deposit' | 'payback'>('deposit')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

  // Transfer log popup state
  const [showTransferLog, setShowTransferLog] = useState(false)
  const [transfers, setTransfers] = useState(initialTransferLog)
  const [editingTransfer, setEditingTransfer] = useState<(FundTransfer & { shopper?: { name: string } | null }) | null>(null)
  const [showEditTransfer, setShowEditTransfer] = useState(false)
  const [editTransferType, setEditTransferType] = useState<'give' | 'return'>('give')
  const [transferLoading, setTransferLoading] = useState(false)

  useEffect(() => {
    if (selectedMonth) {
       const now = new Date()
       const selected = new Date(selectedMonth)
       const isCurrentMonth = now.getMonth() === selected.getMonth() && now.getFullYear() === selected.getFullYear()
       
       if (isCurrentMonth) {
         setTransferDate(new Date().toISOString().split('T')[0])
       } else {
         setTransferDate(selectedMonth)
       }
    }
  }, [selectedMonth])

  // Keep transfers in sync when prop changes (e.g. after revalidation)
  useEffect(() => {
    setTransfers(initialTransferLog)
  }, [initialTransferLog])

  // Transfer log handlers
  async function handleTransferUpdate(formData: FormData) {
    if (!editingTransfer) return
    setTransferLoading(true)
    
    if (editTransferType === 'return') {
      const amount = Number(formData.get('amount'))
      formData.set('amount', String(-Math.abs(amount)))
    } else {
      const amount = Number(formData.get('amount'))
      formData.set('amount', String(Math.abs(amount)))
    }

    const result = await updateFundTransfer(editingTransfer.id, formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Transfer updated!')
      setShowEditTransfer(false)
      setEditingTransfer(null)
    }
    setTransferLoading(false)
  }

  async function handleTransferDelete(id: string) {
    if (!confirm('Are you sure you want to delete this transfer? This will affect balances.')) return
    const result = await deleteFundTransfer(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Transfer deleted!')
      setTransfers(prev => prev.filter(t => t.id !== id))
    }
  }

  function startEditTransfer(transfer: FundTransfer & { shopper?: { name: string } | null }) {
    setEditingTransfer(transfer)
    setEditTransferType(transfer.amount >= 0 ? 'give' : 'return')
    setShowEditTransfer(true)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    let result;
    if (editingItem) {
      result = await updateBajarItem(editingItem.id, formData)
    } else {
      result = await addBajarItem(formData)
    }

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(editingItem ? 'Item updated!' : 'Item added!')
      setShowForm(false)
      setEditingItem(null)
    }
    setLoading(false)
  }

  async function handleTransferSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    // Handle returns (negative transfer)
    if (transferType === 'return') {
        const amount = Number(formData.get('amount'))
        formData.set('amount', String(-Math.abs(amount)))
    }
    
    const result = await addFundTransfer(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(transferType === 'give' ? 'Funds transferred!' : 'Return recorded!')
      setShowTransferForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    const result = await deleteBajarItem(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Item deleted!')
    }
    if (editingItem?.id === id) {
        setEditingItem(null)
        setShowForm(false)
    }
  }

  function startEdit(item: Pick<BajarItem, 'id' | 'item_name' | 'cost' | 'purchase_date' | 'user_id'> & { user: { name: string } | null }) {
    setEditingItem(item)
    setShowForm(true)
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setShowForm(false)
    setEditingItem(null)
    setShowTransferForm(false)
    setError(null)
  }

  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0)
  const myBalance = shopperBalances[currentUserId] || 0

  // Helper to open add form
  const openAddForm = () => {
    setEditingItem(null)
    setPaymentPreference('deposit')
    setShowTransferForm(false)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 pb-24">
      {/* Header Section - Unified Layout */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">🛒 Shopping</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track spending</p>
        </div>
        <MonthSelector selectedMonth={selectedMonth} />
      </div>

      {/* Action Buttons Row */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              setEditingItem(null)
              setShowForm(false)
              setShowTransferForm(!showTransferForm)
            }} 
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3"
          >
            💸 Transfer
          </button>
          <button
            onClick={() => setShowTransferLog(true)}
            className="btn bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-3"
          >
            📋 Log ({transfers.length})
          </button>
          <button 
            onClick={() => {
              setEditingItem(null)
              setShowTransferForm(false)
              setShowForm(!showForm)
            }} 
            className="btn btn-primary text-sm py-2 px-3"
          >
            {showForm && !editingItem ? '✕ Close' : '+ Add Item'}
          </button>
          
          {/* Shopper Selector Button */}
          <div className="relative ml-auto">
            <select 
              value={viewShopperId}
              onChange={(e) => setViewShopperId(e.target.value)}
              className="appearance-none bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg px-3 py-2 pr-8 border border-slate-600 outline-none cursor-pointer transition-colors"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="text-gray-900 bg-white">{u.name}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Stats Cards - Compact */}
      <div className="grid gap-3 grid-cols-3">
        {/* Total Cost */}
        <div className="p-3 sm:p-4 rounded-xl shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase">Spent</p>
          <p className="text-lg sm:text-2xl font-bold">৳{totalCost.toLocaleString()}</p>
        </div>

        {/* Manager Has */}
        <div className="p-3 sm:p-4 rounded-xl shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase">Manager</p>
          <p className="text-lg sm:text-2xl font-bold">৳{managerBalance.toLocaleString()}</p>
        </div>

        {/* Shopper Balance - Clean Display */}
        <div className="p-3 sm:p-4 rounded-xl shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase">{users.find(u => u.id === viewShopperId)?.name || 'Shopper'}</p>
          <p className="text-lg sm:text-2xl font-bold">৳{Math.max(0, shopperBalances[viewShopperId] || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Transfer Funds Sheet */}
      <Sheet open={showTransferForm} onOpenChange={setShowTransferForm}>
        <SheetContent side="responsive" className="h-[85vh] sm:h-auto overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <span>💸</span> {transferType === 'give' ? 'Transfer Funds to Shopper' : 'Receive Return from Shopper'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex bg-muted/50 p-1 rounded-lg mb-6">
            <button 
                type="button"
                onClick={() => setTransferType('give')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${transferType === 'give' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-muted-foreground hover:bg-white/50'}`}
            >
                To Shopper →
            </button>
            <button 
                type="button"
                onClick={() => setTransferType('return')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${transferType === 'return' ? 'bg-white dark:bg-gray-800 shadow text-amber-600' : 'text-muted-foreground hover:bg-white/50'}`}
            >
                 Return ←
            </button>
          </div>

          <form action={handleTransferSubmit} className="space-y-4">
            {error && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                {error}
            </div>
            )}
            
            <div className="grid gap-4">
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Select Shopper {transferType === 'return' && '(Returning Funds)'}
                  </label>
                  <select 
                      name="shopper_id" 
                      required 
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                  <option value="">Select Member</option>
                  {users.map((user) => (
                      <option key={user.id} value={user.id}>
                          {user.name} (Has: ৳{Math.max(0, shopperBalances[user.id] || 0)})
                      </option>
                  ))}
                  </select>
              </div>
              
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Amount (৳)
                  </label>
                  <input 
                      type="number" 
                      name="amount" 
                      min="1"
                      placeholder="e.g. 500" 
                      required 
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
              </div>

              <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input 
                        type="date" 
                        name="transfer_date" 
                        defaultValue={transferDate}
                        key={transferDate}
                        required
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="submit" className={`btn flex-1 text-white border-none ${transferType === 'give' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`} disabled={loading}>
                  {loading ? 'Processing...' : (transferType === 'give' ? 'Transfer Money' : 'Confirm Return')}
              </button>
              <button type="button" onClick={handleCancel} className="btn flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
                  Cancel
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Item Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="responsive" className="h-[85vh] sm:h-auto overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</SheetTitle>
          </SheetHeader>
          
          <form key={editingItem ? editingItem.id : 'new'} action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Item Name
                </label>
                <input 
                    type="text" 
                    name="item_name" 
                    defaultValue={editingItem?.item_name || ""}
                    placeholder="e.g. Rice, Dal, Vegetables" 
                    required 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Shopper
                </label>
                <select 
                    name="user_id" 
                    required 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    defaultValue={editingItem?.user_id || ""}
                >
                  <option value="">Select Member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input 
                    type="date" 
                    name="purchase_date" 
                    defaultValue={editingItem?.purchase_date || today} 
                    required 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Cost (৳)
                </label>
                <input 
                    type="number" 
                    name="cost" 
                    step="0.01" 
                    defaultValue={editingItem?.cost || ""}
                    placeholder="0.00" 
                    required 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">If expense exceeds shopper balance</label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-2">
                    <label className={`flex items-center gap-2 cursor-pointer p-2 rounded shadow-sm border transition-all flex-1 ${paymentPreference === 'deposit' ? 'bg-white dark:bg-gray-800 border-teal-200 ring-1 ring-teal-200' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200'}`}>
                        <input 
                            type="radio" 
                            name="payment_preference"
                            value="deposit"
                            checked={paymentPreference === 'deposit'}
                            onChange={() => setPaymentPreference('deposit')}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Meal Deposit</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer p-2 rounded shadow-sm border transition-all flex-1 ${paymentPreference === 'payback' ? 'bg-white dark:bg-gray-800 border-amber-200 ring-1 ring-amber-200' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200'}`}>
                        <input 
                            type="radio" 
                            name="payment_preference"
                            value="payback"
                            checked={paymentPreference === 'payback'}
                            onChange={() => setPaymentPreference('payback')}
                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Payback</span>
                    </label>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {paymentPreference === 'deposit' 
                        ? 'Excess amount will be added to the shopper\'s meal deposit'
                        : 'Manager will owe the excess amount to the shopper'}
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="submit" className="btn flex-1 btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none" disabled={loading}>
                {loading ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update Item' : 'Add Item')}
              </button>
              <button type="button" onClick={handleCancel} className="btn flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
                Cancel
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Items Table */}
      <div className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {items.length > 0 ? (
          <>
            {/* Unified Table View for Mobile & Desktop */}
            <div className="table-container overflow-x-auto overflow-y-auto max-h-[70vh] sm:max-h-none">
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Item</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Shopper</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400" style={{ textAlign: 'right' }}>Cost</th>
                    {isAdmin && <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400" style={{ textAlign: 'center' }}>Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item, index) => (
                    <tr key={item.id} className={`transition-colors ${editingItem?.id === item.id ? "bg-blue-50 dark:bg-blue-900/20" : index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"} hover:bg-teal-50/50 dark:hover:bg-teal-900/20`}>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 w-[120px]">{new Date(item.purchase_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.item_name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {item.user?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">৳{item.cost}</td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                             <button
                              onClick={() => startEdit(item)}
                              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none shadow-md hover:shadow-lg transition-all dark:bg-red-600 dark:hover:bg-red-500"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            {/* Animated Cart Icon */}
            <div className="relative mb-6">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, hsl(176 80% 92%), hsl(176 60% 85%))',
                  animation: 'float 3s ease-in-out infinite'
                }}
              >
                <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 animate-pulse" />
              <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No shopping items yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Start tracking your grocery and shopping expenses to manage your budget better
            </p>
            
            {isAdmin && (
              <button 
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, hsl(176 80% 36%), hsl(176 70% 42%))' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button for Quick Add */}
      {isAdmin && !showForm && !showTransferForm && (
        <button
          onClick={openAddForm}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-lg z-40 flex items-center justify-center transition-all duration-200 sm:hidden"
          aria-label="Add shopping item"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
      {/* Transfer Log Popup */}
      <Sheet open={showTransferLog} onOpenChange={setShowTransferLog}>
        <SheetContent side="responsive" className="h-[90vh] sm:h-auto sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="pb-3 border-b border-border/50 flex-shrink-0">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm">📋</span>
                Transfer Log
              </span>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {transfers.length} transfers
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pb-4">
            {transfers.length > 0 ? (
              transfers.map((transfer) => (
                <div key={transfer.id} className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                  {/* Row 1: Shopper + Type badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{transfer.shopper?.name || 'Unknown'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        transfer.amount >= 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {transfer.amount >= 0 ? 'Given' : 'Returned'}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => startEditTransfer(transfer)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleTransferDelete(transfer.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Row 2: Amount + Date */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold tabular-nums ${
                      transfer.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {transfer.amount >= 0 ? '-' : '+'}{Math.abs(transfer.amount).toLocaleString()} ৳
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(transfer.transfer_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1">No transfers yet</h3>
                <p className="text-sm text-muted-foreground">Fund transfers for this month will appear here</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Transfer Sheet */}
      <Sheet open={showEditTransfer} onOpenChange={setShowEditTransfer}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Transfer</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <div className="flex bg-muted/50 p-1 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setEditTransferType('give')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${editTransferType === 'give' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-muted-foreground hover:bg-white/50'}`}
              >
                To Shopper →
              </button>
              <button
                type="button"
                onClick={() => setEditTransferType('return')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${editTransferType === 'return' ? 'bg-white dark:bg-gray-800 shadow text-amber-600' : 'text-muted-foreground hover:bg-white/50'}`}
              >
                Return ←
              </button>
            </div>

            <form action={handleTransferUpdate} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Shopper
                  </label>
                  <select
                    name="shopper_id"
                    required
                    defaultValue={editingTransfer?.shopper_id}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select Member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Amount (৳)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    defaultValue={editingTransfer ? Math.abs(editingTransfer.amount) : ''}
                    placeholder="e.g. 500"
                    required
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    name="transfer_date"
                    defaultValue={editingTransfer?.transfer_date}
                    required
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className={`btn flex-1 text-white border-none ${editTransferType === 'give' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`} disabled={transferLoading}>
                  {transferLoading ? 'Updating...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditTransfer(false)} className="btn flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
