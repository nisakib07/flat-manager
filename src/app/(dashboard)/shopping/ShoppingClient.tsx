'use client'

import { useState } from 'react'
import { addBajarItem, deleteBajarItem } from '../actions'
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

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addBajarItem(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    await deleteBajarItem(id)
  }

  const today = new Date().toISOString().split('T')[0]
  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Shopping List (বাজার)</h1>
          <p className="page-description">Track daily shopping expenses</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ background: 'var(--gradient-accent)', border: 'none' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Spending</p>
            <p className="text-3xl font-bold text-white">৳{totalCost.toLocaleString()}</p>
          </div>
          <div className="text-white/80">
            <p className="text-sm">{items.length} items</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">Add Shopping Item</h3>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Bought By
                </label>
                <select name="user_id" required>
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Date
                </label>
                <input type="date" name="purchase_date" defaultValue={today} required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Item Name
                </label>
                <input type="text" name="item_name" placeholder="e.g., Rice, Vegetables" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Cost (৳)
                </label>
                <input type="number" name="cost" step="0.01" placeholder="0.00" required />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Item'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
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
                  <th>Bought By</th>
                  <th>Cost</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.purchase_date).toLocaleDateString()}</td>
                    <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.item_name}</td>
                    <td>{item.user?.name || 'Unknown'}</td>
                    <td className="font-semibold">৳{item.cost}</td>
                    {isAdmin && (
                      <td>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-ghost text-sm p-2"
                          style={{ color: 'var(--danger)' }}
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
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No shopping items</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start by adding a shopping item</p>
          </div>
        )}
      </div>
    </div>
  )
}
