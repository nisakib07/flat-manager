'use client'

import { useState } from 'react'
import { addBajarItem, deleteBajarItem, updateBajarItem } from '../actions'
import type { User, BajarItem } from '@/types/database'

interface ShoppingClientProps {
  users: User[]
  items: (BajarItem & { user: { name: string } })[]
  isAdmin: boolean
}

export default function ShoppingClient({ users, items, isAdmin }: ShoppingClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<(BajarItem & { user: { name: string } }) | null>(null)

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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    await deleteBajarItem(id)
    if (editingItem?.id === id) {
        setEditingItem(null)
        setShowForm(false)
    }
  }

  function startEdit(item: BajarItem & { user: { name: string } }) {
    setEditingItem(item)
    setShowForm(true)
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setShowForm(false)
    setEditingItem(null)
    setError(null)
  }

  const today = new Date().toISOString().split('T')[0]
  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">🛒 Shopping List</h1>
          <p className="page-description">Daily shopping tracking</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
                setEditingItem(null)
                setShowForm(!showForm)
            }} 
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm && !editingItem ? 'Close' : 'Add New Item'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ background: 'var(--gradient-accent)', border: 'none' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Cost</p>
            <p className="text-3xl font-bold text-white">৳{totalCost.toLocaleString()}</p>
          </div>
          <div className="text-white/80">
            <p className="text-sm">{items.length} Items</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <form key={editingItem ? editingItem.id : 'new'} action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Shopper
                </label>
                <select 
                    name="user_id" 
                    required 
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                    defaultValue={editingItem?.user_id || ""}
                >
                  <option value="">Select Member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Date
                </label>
                <input 
                    type="date" 
                    name="purchase_date" 
                    defaultValue={editingItem?.purchase_date || today} 
                    required 
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Item Name
                </label>
                <input 
                    type="text" 
                    name="item_name" 
                    defaultValue={editingItem?.item_name || ""}
                    placeholder="e.g. Rice, Dal, Vegetables" 
                    required 
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Cost (৳)
                </label>
                <input 
                    type="number" 
                    name="cost" 
                    step="0.01" 
                    defaultValue={editingItem?.cost || ""}
                    placeholder="0.00" 
                    required 
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent" 
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update Item' : 'Add Item')}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="card">
        {items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Shopper</th>
                  <th>Cost</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={editingItem?.id === item.id ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""}>
                    <td>{new Date(item.purchase_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</td>
                    <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.item_name}</td>
                    <td>{item.user?.name || 'Unknown'}</td>
                    <td className="font-semibold">৳{item.cost}</td>
                    {isAdmin && (
                      <td className="flex items-center gap-2">
                         <button
                          onClick={() => startEdit(item)}
                          className="btn btn-ghost text-sm p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-ghost text-sm p-2"
                          style={{ color: 'var(--danger)' }}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No shopping items found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start by adding a new item</p>
          </div>
        )}
      </div>
    </div>
  )
}
