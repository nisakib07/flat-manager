"use client"
import { useState } from 'react'
import { updateUserRole, deleteUser } from '../actions'
import type { User } from '@/types/database'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Crown, User as UserIcon, Trash2 } from 'lucide-react'
import { cn } from "@/lib/utils"

interface UsersClientProps {
  users: User[]
  isAdmin: boolean
  currentUserId: string
}

export default function UsersClient({ users, isAdmin, currentUserId }: UsersClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: 'admin' | 'viewer') {
    if (!confirm(newRole === 'admin' 
      ? 'Are you sure you want to promote this user to admin?' 
      : 'Are you sure you want to remove admin role?')) return
    
    setLoading(userId)
    await updateUserRole(userId, newRole)
    setLoading(null)
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone and will remove all their associated data.')) return
    
    setLoading(userId)
    await deleteUser(userId)
    setLoading(null)
  }

  const currentAdmin = users.find(u => u.role === 'super_admin') || users.find(u => u.role === 'admin')

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Member Management
        </h1>
        <p className="text-muted-foreground">Manage members and admin roles</p>
      </div>

      {/* Info Card */}
      <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
          <div className="p-4 flex items-start gap-3">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400">
                <Info className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100">Admin Role</h3>
                <p className="text-sm mt-1 text-indigo-700 dark:text-indigo-300/80">
                   Super Admin has full control over all features. Currently, <strong className="font-semibold text-indigo-950 dark:text-white">{currentAdmin?.name || 'No Admin'}</strong> is the Super Admin.
                </p>
             </div>
          </div>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-card">
            <div className="p-5">
                <div className="flex items-center gap-4">
                    <div 
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm ring-2 ring-white dark:ring-border",
                            user.role === 'super_admin'
                                ? "bg-gradient-to-br from-amber-500 to-orange-600 ring-amber-500/50"
                                : user.role === 'admin' 
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-600" 
                                    : "bg-gradient-to-br from-teal-400 to-emerald-500"
                        )}
                    >
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate text-foreground">{user.name}</h3>
                            {user.id === currentUserId && (
                                <Badge variant="secondary" className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                                    You
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                     <Badge 
                        variant="outline" 
                        className={cn(
                            "gap-1 pl-2 pr-3 py-1 font-semibold",
                            user.role === 'super_admin'
                                ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                                : user.role === 'admin' 
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                        )}
                    >
                        {user.role === 'super_admin' ? <Crown className="w-3.5 h-3.5 fill-current" /> : user.role === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Member'}
                     </Badge>

                     {isAdmin && user.id !== currentUserId && (
                        <div className="flex items-center gap-2">
                            {/* Allow modifying only if target is NOT super_admin (safety) */}
                            {user.role !== 'super_admin' && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'viewer' : 'admin')}
                                    disabled={loading === user.id}
                                    className="h-8 text-xs font-semibold"
                                >
                                    {loading === user.id ? 'Updating...' : user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                disabled={loading === user.id}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Delete Member"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                     )}
                </div>

                <div className="mt-3 text-[10px] text-muted-foreground text-right uppercase tracking-wider font-medium">
                    Joined: {new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card className="p-8 pb-12">
           <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <UserIcon className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No members found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">Members will appear here after signing up for the application.</p>
           </div>
        </Card>
      )}
    </div>
  )
}
