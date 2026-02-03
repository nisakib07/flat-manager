'use client'

import { useState } from 'react'
import { addBajarItem, deleteBajarItem, updateBajarItem, addFundTransfer } from '../actions'
import type { User, BajarItem } from '@/types/database'

interface ShoppingClientProps {
  users: Pick<User, 'id' | 'name'>[]
  items: (Pick<BajarItem, 'id' | 'item_name' | 'cost' | 'purchase_date' | 'user_id'> & { user: { name: string } | null })[]
  isAdmin: boolean
  managerBalance: number
  shopperBalances: Record<string, number>
  currentUserId: string
}

export default function ShoppingClient({ 
  users, 
  items, 
  isAdmin, 
  managerBalance, 
  shopperBalances, 
  currentUserId 
}: ShoppingClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<(Pick<BajarItem, 'id' | 'item_name' | 'cost' | 'purchase_date' | 'user_id'> & { user: { name: string } | null }) | null>(null)

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
      setError(result.error)
    } else {
      setShowForm(false)
      setEditingItem(null)
    }
    setLoading(false)
  }

  async function handleTransferSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await addFundTransfer(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setShowTransferForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    await deleteBajarItem(id)
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

  const today = new Date().toISOString().split('T')[0]
  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0)
  const myBalance = shopperBalances[currentUserId] || 0

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">🛒 Shopping List</h1>
          <p className="page-description">Daily shopping tracking</p>
        </div>
        <div className="flex gap-2">
            {isAdmin && (
            <button 
                onClick={() => {
                    setEditingItem(null)
                    setShowForm(false)
                    setShowTransferForm(!showTransferForm)
                }} 
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                <span className="mr-2">💸</span>
                Transfer Funds
            </button>
            )}
            {isAdmin && (
            <button 
                onClick={() => {
                    setEditingItem(null)
                    setShowTransferForm(false)
                    setShowForm(!showForm)
                }} 
                className="btn btn-primary"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm && !editingItem ? 'Close' : 'Add Item'}
            </button>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Cost */}
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white transform hover:scale-[1.02] transition-transform">
          <div className="flex flex-col">
            <p className="text-white/90 text-sm font-medium">Total Spent (Month)</p>
            <p className="text-3xl font-bold mt-1">৳{totalCost.toLocaleString()}</p>
          </div>
        </div>

        {/* Manager Has */}
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white transform hover:scale-[1.02] transition-transform">
            <div className="flex flex-col">
                <p className="text-white/90 text-sm font-medium">Manager Has 👑</p>
                <p className="text-3xl font-bold mt-1">৳{managerBalance.toLocaleString()}</p>
            </div>
        </div>

        {/* Shopper Has (My Cash) */}
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white transform hover:scale-[1.02] transition-transform">
            <div className="flex flex-col">
                <p className="text-white/90 text-sm font-medium">My Cash 💰</p>
                <p className="text-3xl font-bold mt-1">৳{myBalance.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {/* Transfer Funds Form */}
      {showTransferForm && (
        <div className="card animate-fadeIn bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="card-title mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span>💸</span> Transfer Funds to Shopper
          </h3>
          <form action={handleTransferSubmit} className="space-y-4">
            {error && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                {error}
            </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Select Shopper
                </label>
                <select 
                    name="shopper_id" 
                    required 
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                <option value="">Select Member</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} (Has: ৳{shopperBalances[user.id] || 0})
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

            <div className="hidden">
                  <input type="date" name="transfer_date" defaultValue={today} />
            </div>
            </div>
            
            <div className="flex gap-3">
            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none" disabled={loading}>
                {loading ? 'Processing...' : 'Transfer Money'}
            </button>
            <button type="button" onClick={handleCancel} className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
                Cancel
            </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card animate-fadeIn bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="card-title mb-4 text-gray-900 dark:text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <form key={editingItem ? editingItem.id : 'new'} action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
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
              
              <div>
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
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none" disabled={loading}>
                {loading ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update Item' : 'Add Item')}
              </button>
              <button type="button" onClick={handleCancel} className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border-none">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {items.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="table-container hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Item</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Shopper</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400" style={{ textAlign: 'right' }}>Cost</th>
                    {isAdmin && <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400" style={{ textAlign: 'center' }}>Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${editingItem?.id === item.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform ${
                    editingItem?.id === item.id ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => isAdmin && startEdit(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-gray-900 dark:text-white leading-tight truncate">{item.item_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                        <span>📅 {new Date(item.purchase_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          👤 {item.user?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        ৳{item.cost}
                      </span>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                        className="h-9 px-4 text-xs font-semibold text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(item)
                        }}
                        className="h-9 px-4 text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state py-12 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No shopping items found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Start by adding a new item</p>
          </div>
        )}
      </div>
    </div>
  )
}
