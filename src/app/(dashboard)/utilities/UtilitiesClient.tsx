'use client'

import { useState } from 'react'
import { addUtilityExpense, deleteUtilityExpense } from '../actions'
import type { UtilityExpense } from '@/types/database'

interface UtilitiesClientProps {
  expenses: UtilityExpense[]
  isAdmin: boolean
  usersCount: number
}

const expenseTypes = ['Rent', 'Electricity', 'Wi-Fi', 'Gas', 'Water', 'Other']

export default function UtilitiesClient({ expenses, isAdmin, usersCount }: UtilitiesClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addUtilityExpense(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    await deleteUtilityExpense(id)
  }

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  const totalCost = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const perPerson = usersCount > 0 ? totalCost / usersCount : 0

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Utility Expenses</h1>
          <p className="page-description">Manage rent, electricity, and other utilities</p>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card">
          <span className="stat-label">Total Utilities</span>
          <span className="stat-value">৳{totalCost.toLocaleString()}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>This month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Per Person</span>
          <span className="stat-value">৳{perPerson.toLocaleString()}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Split among {usersCount} flatmates</span>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">Add Utility Expense</h3>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Expense Type
                </label>
                <select name="expense_type" required>
                  <option value="">Select type</option>
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Amount (৳)
                </label>
                <input type="number" name="amount" step="0.01" placeholder="0.00" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Month
                </label>
                <input type="date" name="month" defaultValue={currentMonth} required />
              </div>
            </div>
            
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

      {/* Expenses Table */}
      <div className="card">
        {expenses.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Per Person</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                    <td>
                      <span className="badge badge-primary">{expense.expense_type}</span>
                    </td>
                    <td className="font-semibold">৳{expense.amount}</td>
                    <td>৳{usersCount > 0 ? (Number(expense.amount) / usersCount).toFixed(2) : expense.amount}</td>
                    {isAdmin && (
                      <td>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No utility expenses</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start by adding a utility expense</p>
          </div>
        )}
      </div>
    </div>
  )
}
