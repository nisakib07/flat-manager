'use client'

import { useState } from 'react'
import { addMealCost, deleteMealCost } from '../actions'
import type { User, MealCost } from '@/types/database'

interface MealsClientProps {
  users: User[]
  mealCosts: (MealCost & { user: { name: string } })[]
  isAdmin: boolean
}

export default function MealsClient({ users, mealCosts, isAdmin }: MealsClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addMealCost(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this meal entry?')) return
    await deleteMealCost(id)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Meal Costs</h1>
          <p className="page-description">Track daily meal consumption and costs</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Meal
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card animate-fadeIn">
          <h3 className="card-title mb-4">Add Meal Entry</h3>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  User
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
                <input type="date" name="meal_date" defaultValue={today} required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Meal Type
                </label>
                <select name="meal_type" required>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Meal Weight
                </label>
                <input type="number" name="meal_weight" step="0.5" defaultValue="1" min="0.5" required />
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
                {loading ? 'Adding...' : 'Add Meal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meals Table */}
      <div className="card">
        {mealCosts.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Weight</th>
                  <th>Cost</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {mealCosts.map((meal) => (
                  <tr key={meal.id}>
                    <td>{new Date(meal.meal_date).toLocaleDateString()}</td>
                    <td>{meal.user?.name || 'Unknown'}</td>
                    <td>
                      <span className={`badge ${meal.meal_type === 'Lunch' ? 'badge-primary' : 'badge-warning'}`}>
                        {meal.meal_type}
                      </span>
                    </td>
                    <td>{meal.meal_weight}</td>
                    <td className="font-semibold">৳{meal.cost}</td>
                    {isAdmin && (
                      <td>
                        <button
                          onClick={() => handleDelete(meal.id)}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No meals recorded</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start by adding a meal entry</p>
          </div>
        )}
      </div>
    </div>
  )
}
