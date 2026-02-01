'use client'

import { useState } from 'react'
import { addDeposit } from '../actions'
import type { User, MealDeposit } from '@/types/database'

interface DepositsClientProps {
  users: User[]
  deposits: (MealDeposit & { user: { name: string } })[]
  isAdmin: boolean
  currentUserId: string
}

export default function DepositsClient({ users, deposits, isAdmin, currentUserId }: DepositsClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addDeposit(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
    setLoading(false)
  }

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.deposit), 0)
  
  // Group deposits by user
  const userDeposits = deposits.reduce((acc, d) => {
    if (!acc[d.user_id]) {
      acc[d.user_id] = { name: d.user?.name || 'Unknown', total: 0, deposits: [] as typeof deposits }
    }
    acc[d.user_id].total += Number(d.deposit) + Number(d.carry_forward)
    acc[d.user_id].deposits.push(d)
    return acc
  }, {} as Record<string, { name: string; total: number; deposits: typeof deposits }>)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Meal Deposits</h1>
          <p className="page-description">Manage monthly meal deposits for flatmates</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deposit
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Deposits</p>
            <p className="text-3xl font-bold text-white">৳{totalDeposits.toLocaleString()}</p>
          </div>
          <div className="text-white/80">
            <p className="text-sm">{deposits.length} records</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">Add Deposit</h3>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  User
                </label>
                <select name="user_id" defaultValue={isAdmin ? '' : currentUserId} required>
                  {isAdmin ? (
                    <>
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </>
                  ) : (
                    <option value={currentUserId}>
                      {users.find(u => u.id === currentUserId)?.name}
                    </option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Amount (৳)
                </label>
                <input type="number" name="deposit" step="0.01" placeholder="0.00" required />
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
                {loading ? 'Adding...' : 'Add Deposit'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Per-User Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(userDeposits).map(([userId, data]) => (
          <div key={userId} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--gradient-accent)' }}>
                {data.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.name}</h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{data.deposits.length} deposit(s)</p>
              </div>
            </div>
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Balance</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>৳{data.total.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* All Deposits Table */}
      <div className="card">
        <h3 className="card-title mb-4">Deposit History</h3>
        {deposits.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>User</th>
                  <th>Deposit</th>
                  <th>Carry Forward</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>{new Date(deposit.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                    <td>{deposit.user?.name || 'Unknown'}</td>
                    <td className="font-semibold">৳{deposit.deposit}</td>
                    <td style={{ color: Number(deposit.carry_forward) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {Number(deposit.carry_forward) >= 0 ? '+' : ''}৳{deposit.carry_forward}
                    </td>
                    <td className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      ৳{(Number(deposit.deposit) + Number(deposit.carry_forward)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No deposits yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start by adding a meal deposit</p>
          </div>
        )}
      </div>
    </div>
  )
}
