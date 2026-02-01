'use client'

import { useState } from 'react'
import { updateUserRole } from '../actions'
import type { User } from '@/types/database'

interface UsersClientProps {
  users: User[]
  isAdmin: boolean
  currentUserId: string
}

export default function UsersClient({ users, isAdmin, currentUserId }: UsersClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: 'admin' | 'viewer') {
    if (!confirm(`Are you sure you want to make this user ${newRole}?`)) return
    setLoading(userId)
    await updateUserRole(userId, newRole)
    setLoading(null)
  }

  const currentAdmin = users.find(u => u.role === 'admin')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-description">Manage flatmates and admin roles</p>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)' }}>
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 mt-0.5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Role</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              The admin has full control over all features. Currently, <strong>{currentAdmin?.name || 'No admin'}</strong> is the admin.
              The admin role can be transferred to another user at the start of each month.
            </p>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="card">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: user.role === 'admin' ? 'var(--gradient-primary)' : 'var(--gradient-accent)' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success)', color: 'white' }}>
                      You
                    </span>
                  )}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--card-border)' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                {user.role === 'admin' ? '👑 Admin' : 'Viewer'}
              </span>
              
              {isAdmin && user.id !== currentUserId && (
                <button
                  onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'viewer' : 'admin')}
                  disabled={loading === user.id}
                  className="btn btn-secondary text-sm"
                >
                  {loading === user.id ? 'Updating...' : user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </button>
              )}
            </div>
            
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>No users yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Users will appear here once they sign up</p>
          </div>
        </div>
      )}
    </div>
  )
}
