'use client'

import { useState, useTransition, useOptimistic, useMemo } from 'react'
import {
  addMealWithWeight,
  updateMealWeight,
  deleteMealEntry
} from '../actions'
import type { User, MealCost } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Utensils, Moon, Sun, CalendarDays } from 'lucide-react'

interface MonthlyMealGridProps {
  users: User[]
  monthlyMealCosts: MealCost[]
  selectedDate: string
  isAdmin: boolean
}

interface EditingMeal {
  mealId?: string
  userId: string
  mealTime: 'Lunch' | 'Dinner'
  weight: number
  isNew: boolean
  date: string
}

type OptimisticAction = 
  | { type: 'add_or_update', meal: MealCost }
  | { type: 'delete', id: string }

export default function MonthlyMealGrid({
  users,
  monthlyMealCosts,
  selectedDate,
  isAdmin
}: MonthlyMealGridProps) {
  const [isPending, startTransition] = useTransition()
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null)
  const [customWeight, setCustomWeight] = useState('')

  const [optimisticMeals, addOptimisticAction] = useOptimistic(
    monthlyMealCosts,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'add_or_update':
          const exists = state.some(
            m => (m.id === action.meal.id) || 
                 (m.user_id === action.meal.user_id && 
                  m.meal_date === action.meal.meal_date && 
                  m.meal_type === action.meal.meal_type)
          );
          
          if (exists) {
            return state.map(m => {
                if (m.id === action.meal.id) return action.meal;
                // Match by composite key if ID is temp/unknown or just to be safe
                if (m.user_id === action.meal.user_id && 
                    m.meal_date === action.meal.meal_date && 
                    m.meal_type === action.meal.meal_type) {
                    return { ...m, ...action.meal };
                }
                return m;
            })
          } else {
            return [...state, action.meal];
          }
        case 'delete':
          return state.filter(m => m.id !== action.id);
        default:
          return state;
      }
    }
  );

  // Optimize lookup with a Map
  const mealsMap = useMemo(() => {
    const map = new Map<string, MealCost>();
    optimisticMeals.forEach(meal => {
        map.set(`${meal.user_id}-${meal.meal_date}-${meal.meal_type}`, meal);
    });
    return map;
  }, [optimisticMeals]);

  // Generate dates for the current month
  const getDaysInMonth = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()

    return Array.from({ length: days }, (_, i) => {
      const day = i + 1
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    })
  }

  const days = getDaysInMonth(selectedDate)

  // Get user's meal for a specific date and time - O(1) lookup
  const getUserMeal = (userId: string, date: string, mealTime: 'Lunch' | 'Dinner'): MealCost | undefined => {
    return mealsMap.get(`${userId}-${date}-${mealTime}`);
  }

  function openEditModal(userId: string, date: string, mealTime: 'Lunch' | 'Dinner') {
    if (!isAdmin) return

    const existingMeal = getUserMeal(userId, date, mealTime)

    setEditingMeal({
      mealId: existingMeal?.id,
      userId,
      mealTime,
      date,
      weight: existingMeal ? Number(existingMeal.meal_weight) : 1, // Default to 1 if new
      isNew: !existingMeal
    })
    setCustomWeight(existingMeal ? String(existingMeal.meal_weight) : '1')
  }

  async function handleSaveMeal() {
    if (!editingMeal) return
    const currentEditingMeal = editingMeal; // Capture for closure
    const weight = parseFloat(customWeight) || 0

    // Prepare optimistic meal object
    const optimisticMeal: MealCost = {
        id: currentEditingMeal.mealId || `temp-${Date.now()}`,
        user_id: currentEditingMeal.userId,
        meal_date: currentEditingMeal.date,
        meal_type: currentEditingMeal.mealTime,
        meal_weight: weight,
        cost: 0,
        created_at: new Date().toISOString()
    };

    // CLOSE INSTANTLY
    setEditingMeal(null)

    startTransition(async () => {
      // Optimistic Update
      if (weight > 0) {
          addOptimisticAction({ type: 'add_or_update', meal: optimisticMeal });
      } else if (currentEditingMeal.mealId) {
          // If weight 0, treat as delete
          addOptimisticAction({ type: 'delete', id: currentEditingMeal.mealId });
      }

      // Perform Actual Server Action
      if (currentEditingMeal.isNew) {
        if (weight > 0) { // Only add if weight > 0
            await addMealWithWeight(currentEditingMeal.userId, currentEditingMeal.date, currentEditingMeal.mealTime, weight)
        }
      } else if (currentEditingMeal.mealId) {
        if (weight === 0) {
            await deleteMealEntry(currentEditingMeal.mealId)
        } else {
            await updateMealWeight(currentEditingMeal.mealId, weight)
        }
      }
    })
  }

  async function handleDeleteMeal() {
    if (!editingMeal?.mealId) return
    const currentEditingMeal = editingMeal; // Capture for closure

    // CLOSE INSTANTLY
    setEditingMeal(null)

    startTransition(async () => {
      addOptimisticAction({ type: 'delete', id: currentEditingMeal.mealId! });
      await deleteMealEntry(currentEditingMeal.mealId!)
    })
  }

  async function handleSkipMeal() {
    if (!editingMeal) return
    const currentEditingMeal = editingMeal; // Capture for closure

    // CLOSE INSTANTLY
    setEditingMeal(null)
    
    startTransition(async () => {
        // Optimistic delete/skip
        if (currentEditingMeal.mealId) {
             addOptimisticAction({ type: 'delete', id: currentEditingMeal.mealId });
        }
        
        // Server Action
        if (currentEditingMeal.mealId) {
            await updateMealWeight(currentEditingMeal.mealId, 0)
        } else {
            await addMealWithWeight(currentEditingMeal.userId, currentEditingMeal.date, currentEditingMeal.mealTime, 0)
        }
    })
  }

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || ''

  // Current month label
  const monthLabel = new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Calculate totals - USE OPTIMISTIC DATA
  const totalLunch = optimisticMeals.filter(m => m.meal_type === 'Lunch').reduce((sum, m) => sum + Number(m.meal_weight), 0)
  const totalDinner = optimisticMeals.filter(m => m.meal_type === 'Dinner').reduce((sum, m) => sum + Number(m.meal_weight), 0)
  const totalMeals = totalLunch + totalDinner

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            {monthLabel}
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of all meals consumed this month.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 shadow-sm border bg-white dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/50">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Lunch</span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{totalLunch}</span>
                </div>
            </Card>
            <Card className="p-3 shadow-sm border bg-white dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Dinner</span>
                    <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalDinner}</span>
                </div>
            </Card>
             <Card className="p-3 shadow-sm border bg-white dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/50">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{totalMeals}</span>
                </div>
            </Card>
        </div>
      </div>

      <Card className="shadow-md border-muted/60 overflow-hidden">
        <div className="overflow-x-auto relative">
          <Table className="relative border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-md">
              <TableRow className="bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-50/80 dark:hover:bg-teal-900/40 border-b-2 border-teal-100 dark:border-teal-900">
                <TableHead className="sticky left-0 z-30 bg-teal-50 dark:bg-teal-950/40 border-r border-teal-200 dark:border-teal-900 w-[100px] text-center font-bold text-teal-900 dark:text-teal-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                   <div className="flex flex-col items-center justify-center h-full">
                       <CalendarDays className="h-4 w-4 mb-1 opacity-50"/>
                       <span>Date</span>
                   </div>
                </TableHead>
                {users.map(user => (
                  <TableHead key={user.id} className="text-center font-bold text-teal-900 dark:text-teal-100 min-w-[120px] px-2 border-r border-teal-200 dark:border-teal-900 last:border-r-0">
                    {user.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map(day => {
                  const dateObj = new Date(day)
                  const dateNum = dateObj.getDate()
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const isToday = day === new Date().toISOString().split('T')[0]
                  
                  return (
                    <TableRow key={day} className={cn(
                        "transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/20",
                        isToday && "bg-teal-100/40 dark:bg-teal-900/40 hover:bg-teal-100/60 dark:hover:bg-teal-900/60"
                    )}>
                      <TableCell className={cn(
                          "sticky left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-center font-medium border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.05)] p-2",
                          isToday && "bg-teal-600 dark:bg-teal-600 text-white font-extrabold shadow-md"
                      )}>
                          <div className="flex flex-col">
                              <span className="text-lg leading-none">{dateNum}</span>
                              <span className="text-[10px] uppercase opacity-90 font-semibold">{dayName}</span>
                          </div>
                      </TableCell>
                      {users.map(user => {
                          const lunch = getUserMeal(user.id, day, 'Lunch')
                          const dinner = getUserMeal(user.id, day, 'Dinner')
                          const lunchWeight = lunch ? Number(lunch.meal_weight) : 0
                          const dinnerWeight = dinner ? Number(dinner.meal_weight) : 0
                          
                          return (
                              <TableCell key={user.id} className="p-0 border-r border-border last:border-r-0 relative group">
                                  <div className="flex h-12">
                                      {/* Lunch Cell (Teal) */}
                                      <div 
                                          className={cn(
                                              "flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 border-r border-dashed border-border/60 last:border-r-0 hover:bg-teal-100/50 dark:hover:bg-teal-900/20",
                                              lunchWeight > 0 ? "bg-teal-50/60 dark:bg-teal-950/20" : ""
                                          )}
                                          onClick={() => openEditModal(user.id, day, 'Lunch')}
                                      >
                                          {lunchWeight > 0 ? (
                                              <Badge className="h-7 w-7 min-w-7 p-0 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-sm border-none text-xs">
                                                  {lunchWeight}
                                              </Badge>
                                          ) : (
                                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-teal-300 dark:group-hover:bg-teal-700 transition-colors"></span>
                                          )}
                                      </div>

                                      {/* Dinner Cell (Orange) */}
                                      <div 
                                          className={cn(
                                              "flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-orange-100/50 dark:hover:bg-orange-900/20",
                                              dinnerWeight > 0 ? "bg-orange-50/60 dark:bg-orange-950/20" : ""
                                          )}
                                          onClick={() => openEditModal(user.id, day, 'Dinner')}
                                      >
                                          {dinnerWeight > 0 ? (
                                              <Badge className="h-7 w-7 min-w-7 p-0 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-sm border-none text-xs">
                                                  {dinnerWeight}
                                              </Badge>
                                          ) : (
                                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-orange-300 dark:group-hover:bg-orange-700 transition-colors"></span>
                                          )}
                                      </div>
                                  </div>
                              </TableCell>
                          )
                      })}
                    </TableRow>
                  )
              })}
            </TableBody>
            <TableFooter>
                <TableRow className="bg-teal-100 dark:bg-teal-900/50 font-bold sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t-2 border-teal-200 dark:border-teal-800">
                    <TableCell className="sticky left-0 bg-teal-100 dark:bg-teal-900 border-r border-teal-200 dark:border-teal-800 p-3 text-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-teal-900 dark:text-teal-100">Total</TableCell>
                    {users.map(user => {
                        const userMeals = optimisticMeals.filter(m => m.user_id === user.id)
                        const userLunch = userMeals.filter(m => m.meal_type === 'Lunch').reduce((sum, m) => sum + Number(m.meal_weight), 0)
                        const userDinner = userMeals.filter(m => m.meal_type === 'Dinner').reduce((sum, m) => sum + Number(m.meal_weight), 0)
                        return (
                            <TableCell key={user.id} className="text-center border-r border-teal-200 dark:border-teal-800 last:border-r-0 p-2">
                                <div className="flex justify-center gap-3 text-xs">
                                    <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1 font-bold">
                                        <Sun className="w-3 h-3" /> {userLunch}
                                    </span>
                                    <span className="text-orange-700 dark:text-orange-300 flex items-center gap-1 font-bold">
                                        <Moon className="w-3 h-3" /> {userDinner}
                                    </span>
                                </div>
                            </TableCell>
                        )
                    })}
                </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>

      {/* Helper Legend */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
         <div className="flex items-center gap-2">
            <Badge className="h-3 w-3 p-0 rounded-full bg-teal-500 hover:bg-teal-600 border-none"></Badge>
            <span>Lunch</span>
         </div>
         <div className="flex items-center gap-2">
            <Badge className="h-3 w-3 p-0 rounded-full bg-orange-500 hover:bg-orange-600 border-none"></Badge>
            <span>Dinner</span>
         </div>
      </div>

      {/* Edit Modal (Dialog) */}
      <Dialog open={!!editingMeal} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                {editingMeal?.mealTime === 'Lunch' ? <Sun className="w-5 h-5 text-teal-500" /> : <Moon className="w-5 h-5 text-orange-500" />}
                <span>
                 {editingMeal && `${getUserName(editingMeal.userId)}`}
                </span>
            </DialogTitle>
            <CardDescription>
                {editingMeal && new Date(editingMeal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center gap-4">
                <Label htmlFor="weight" className="text-muted-foreground uppercase text-xs tracking-wider">Meal Weight</Label>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => {
                            const val = parseFloat(customWeight) || 0;
                            setCustomWeight(String(Math.max(0, val - 0.5)));
                        }}
                    >
                        -
                    </Button>
                    <Input
                        id="weight"
                        type="number"
                        value={customWeight}
                        onChange={(e) => setCustomWeight(e.target.value)}
                        min="0"
                        step="0.5"
                        className="text-center text-3xl h-16 w-24 border-none shadow-none focus-visible:ring-0 font-bold"
                        autoFocus
                    />
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => {
                            const val = parseFloat(customWeight) || 0;
                            setCustomWeight(String(val + 0.5));
                        }}
                    >
                        +
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                    0 to skip. 1 for standard. Increase for guests.
                </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
             {!editingMeal?.isNew && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMeal}
                disabled={isPending}
                className="w-auto px-3"
                title="Remove Entry"
              >
                <span className="sr-only">Delete</span>
                🗑️
              </Button>
            )}

            {editingMeal?.isNew ? (
                <Button
                    variant="ghost"
                    onClick={handleSkipMeal}
                    disabled={isPending}
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                >
                    Skip (0)
                </Button>
            ) : <div />}

            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingMeal(null)}>
                Cancel
                </Button>
                <Button onClick={handleSaveMeal} disabled={isPending} className={editingMeal?.mealTime === 'Lunch' ? "bg-teal-600 hover:bg-teal-700" : "bg-orange-600 hover:bg-orange-700"}>
                {isPending ? 'Saving...' : 'Save'}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
