'use client'

import { useState, useTransition } from 'react'
import { updateDepositSlot } from '../actions'
import type { User, MealDeposit } from '@/types/database'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DepositsClientProps {
  users: User[]
  deposits: (MealDeposit & { user?: { name: string } })[]
  isAdmin: boolean
  currentUserId: string
}

export default function DepositsClient({ users, deposits, isAdmin, currentUserId }: DepositsClientProps) {
  const [isPending, startTransition] = useTransition()
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  const monthLabel = new Date(currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  // Calculate Grand Total
  const totalDeposits = deposits.reduce((sum, d) => {
    const rowTotal = 
      (Number(d.d1) || 0) + 
      (Number(d.d2) || 0) + 
      (Number(d.d3) || 0) + 
      (Number(d.d4) || 0) + 
      (Number(d.d5) || 0) + 
      (Number(d.d6) || 0) + 
      (Number(d.d7) || 0) + 
      (Number(d.d8) || 0) + 
      (Number(d.carry_forward) || 0)
    return sum + rowTotal
  }, 0)

  // Helper to handle cell updates
  const handleUpdate = (
    userId: string, 
    field: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'carry_forward', 
    value: string
  ) => {
    // Debounce or just save on blur? Save on blur/enter is safest for now to avoid too many requests
    // But basic onBlur is implemented in the Input component usage below
    
    // We only execute if value changed? (Optimization left for later)
    
    startTransition(async () => {
        await updateDepositSlot(userId, currentMonth, field, Number(value) || 0)
    })
  }
  
  // Helper to calculate row total
  const getRowTotal = (userId: string) => {
    const d = deposits.find(dep => dep.user_id === userId)
    if (!d) return 0
    return (
      (Number(d.d1) || 0) + 
      (Number(d.d2) || 0) + 
      (Number(d.d3) || 0) + 
      (Number(d.d4) || 0) + 
      (Number(d.d5) || 0) + 
      (Number(d.d6) || 0) + 
      (Number(d.d7) || 0) + 
      (Number(d.d8) || 0) + 
      (Number(d.carry_forward) || 0)
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Meal Deposits
          </h1>
          <p className="text-muted-foreground mt-1">Manage deposits for {monthLabel}.</p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/30 px-4 py-2 rounded-lg border border-teal-100 dark:border-teal-800">
             <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider mr-2">Total Collected</span>
             <span className="text-2xl font-black text-teal-900 dark:text-teal-100">৳{totalDeposits.toLocaleString()}</span>
        </div>
      </div>

      <Card className="shadow-md border-teal-100 dark:border-teal-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-teal-50/50 dark:bg-teal-950/20">
              <TableRow>
                <TableHead className="w-[150px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Name</TableHead>
                <TableHead className="text-center w-[100px] font-bold text-orange-600 dark:text-orange-400 uppercase text-xs tracking-wider bg-orange-50/50 dark:bg-orange-900/10">C/F</TableHead>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <TableHead key={i} className="text-center w-[100px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">
                    D{i}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[120px] font-bold text-teal-900 dark:text-teal-100 uppercase text-xs tracking-wider bg-teal-100/30 dark:bg-teal-900/10 sticky right-0">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const deposit = deposits.find(d => d.user_id === user.id)
                // If the user is the current user or admin, they can edit. 
                // Wait, typically only Admin tracks deposits? Or users can self-report?
                // Assuming Admin controls deposits for consistency, or maybe trusted users.
                // Let's allow Admin only for now based on "Manager" vibe, or all users if "Flat Manager" implies shared responsibility.
                // The previous code allowed users to add deposits. Let's assume Admin only for "editing" grid to be safe, or check permissions.
                // The prompt didn't specify, but usually "Manager" apps = Admin enters money.
                // However, I'll allow `isAdmin` to edit ALL, and `currentUserId` to edit THEIR OWN?
                // Actually, for a grid view like this, it's safer if only Admin edits to prevent conflicts, or trusted.
                // I will enable inputs for everyone for now, but usually this is an Admin features.
                const canEdit = isAdmin; 

                return (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        {user.name}
                    </TableCell>
                    <TableCell className="p-1 bg-orange-50/10 dark:bg-orange-900/5">
                        <Input 
                            type="number"
                            min="0"
                            step="1"
                            disabled={!canEdit}
                            defaultValue={deposit?.carry_forward || ''}
                            placeholder="0"
                            className="text-center h-8 border-orange-100 focus-visible:ring-orange-400 bg-transparent font-medium text-orange-700 dark:text-orange-400"
                            onBlur={(e) => handleUpdate(user.id, 'carry_forward', e.target.value)}
                        />
                    </TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                        const key = `d${i}` as keyof MealDeposit;
                        // @ts-ignore
                        const val = deposit?.[key] as number;
                        return (
                            <TableCell key={i} className="p-1">
                                <Input 
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="text-center h-8 border-transparent hover:border-teal-100 focus:border-teal-400 focus-visible:ring-teal-400 bg-transparent"
                                    placeholder="-"
                                    disabled={!canEdit}
                                    defaultValue={val || ''}
                                    onBlur={(e) => handleUpdate(user.id, `d${i}` as any, e.target.value)}
                                />
                            </TableCell>
                        )
                    })}
                    <TableCell className="text-right font-black text-teal-700 dark:text-teal-300 bg-teal-50/30 dark:bg-teal-900/5 sticky right-0">
                        ৳{getRowTotal(user.id).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>

          </Table>
        </div>
      </Card>
      
      {!isAdmin && (
         <p className="text-xs text-muted-foreground text-right italic">
            * Only administrators can record deposits.
         </p>
      )}
    </div>
  )
}
