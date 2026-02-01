'use client'

import { useState } from 'react'
import { addCommonExpense, deleteCommonExpense } from '../actions'
import type { CommonExpense } from '@/types/database'

interface CommonExpensesClientProps {
  expenses: CommonExpense[]
  isAdmin: boolean
  usersCount: number
}

export default function CommonExpensesClient({ expenses, isAdmin, usersCount }: CommonExpensesClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addCommonExpense(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    await deleteCommonExpense(id)
  }

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  const totalCost = expenses.reduce((sum, exp) => sum + Number(exp.total_cost), 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Common Expenses</h1>
          <p className="page-description">Shared items like handwash, detergent, etc.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ background: 'var(--gradient-success)', border: 'none' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Common Expenses</p>
            <p className="text-3xl font-bold text-white">৳{totalCost.toLocaleString()}</p>
          </div>
          <div className="text-white/80 text-right">
            <p className="text-sm">Per Person</p>
            <p className="text-xl font-bold text-white">৳{usersCount > 0 ? (totalCost / usersCount).toFixed(2) : 0}</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">Add Common Expense</h3>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Expense Name
                </label>
                <input type="text" name="expense_name" placeholder="e.g., Handwash, Detergent" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Total Cost (৳)
                </label>
                <input type="number" name="total_cost" step="0.01" placeholder="0.00" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Month
                </label>
                <input type="date" name="month" defaultValue={currentMonth} required />
              </div>
            </div>
            
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              The cost will be automatically split among {usersCount} flatmates
            </p>
            
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Grid */}
      <div className="card">
        {expenses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 rounded-lg"
                style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{expense.expense_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(expense.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="btn btn-ghost p-1"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>৳{expense.total_cost}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Per Person</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>৳{expense.user_share}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No common expenses</h3>
            <p style={{ color: 'var(--text-muted)' }}>Add shared items that will be split among flatmates</p>
          </div>
        )}
      </div>
    </div>
  )
}
