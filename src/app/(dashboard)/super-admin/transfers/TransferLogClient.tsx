'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateFundTransfer, deleteFundTransfer } from '../../actions'
import type { User, FundTransfer } from '@/types/database'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface TransferLogClientProps {
  initialTransfers: (FundTransfer & { shopper?: { name: string } | null })[]
  users: Pick<User, 'id' | 'name'>[]
}

export default function TransferLogClient({ initialTransfers, users }: TransferLogClientProps) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [editingTransfer, setEditingTransfer] = useState<(FundTransfer & { shopper?: { name: string } | null }) | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transferType, setTransferType] = useState<'give' | 'return'>('give')

  async function handleUpdate(formData: FormData) {
    if (!editingTransfer) return
    
    setLoading(true)
    setError(null)
    
    // Handle returns (negative transfer)
    if (transferType === 'return') {
        const amount = Number(formData.get('amount'))
        formData.set('amount', String(-Math.abs(amount)))
    } else {
        const amount = Number(formData.get('amount'))
        formData.set('amount', String(Math.abs(amount)))
    }

    const result = await updateFundTransfer(editingTransfer.id, formData)

    if (result?.error) {
      toast.error(result.error)
      setError(result.error)
    } else {
      toast.success('Transfer updated!')
      setShowEditForm(false)
      setEditingTransfer(null)
      // Optimistic update could go here, or rely on revalidatePath
      // For now, let's just close the form. The page will refresh implicitly or user can refresh manually if needed.
      // Ideally we should update the local state too, but let's see.
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this transfer? This will affect balances.')) return
    
    const result = await deleteFundTransfer(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Transfer deleted!')
      // Optimistic remove
      setTransfers(prev => prev.filter(t => t.id !== id))
    }
  }

  function startEdit(transfer: FundTransfer & { shopper?: { name: string } | null }) {
    setEditingTransfer(transfer)
    setTransferType(transfer.amount >= 0 ? 'give' : 'return')
    setShowEditForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transfer Log</h1>
        <p className="text-sm text-gray-500">Total Transfers: {transfers.length}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold">Date</th>
                <th className="py-3 px-4 text-sm font-semibold">Shopper</th>
                <th className="py-3 px-4 text-sm font-semibold">Type</th>
                <th className="py-3 px-4 text-sm font-semibold text-right">Amount</th>
                <th className="py-3 px-4 text-sm font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {transfers.length > 0 ? (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(transfer.transfer_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {transfer.shopper?.name || 'Unknown Shopper'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transfer.amount >= 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {transfer.amount >= 0 ? 'Was Given' : 'Returned'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm font-bold text-right ${
                        transfer.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {transfer.amount >= 0 ? '-' : '+'}{Math.abs(transfer.amount)} ৳
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(transfer)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(transfer.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No transfers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Transfer</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
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

              <form action={handleUpdate} className="space-y-4">
                {error && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                    {error}
                </div>
                )}
                
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
                  <button type="submit" className={`btn flex-1 text-white border-none ${transferType === 'give' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`} disabled={loading}>
                      {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setShowEditForm(false)} className="btn flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
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
