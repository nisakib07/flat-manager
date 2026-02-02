'use client'

import { useState, useTransition } from 'react'
import { 
  setDailyMeal, 
  addMealWithWeight,
  updateMealWeight, 
  deleteMealEntry,
  toggleAllMeals,
  createMealType
} from '../actions'
import type { User, MealCost, MealTypeItem, DailyMeal } from '@/types/database'
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
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MealTableClientProps {
  users: User[]
  mealTypes: MealTypeItem[]
  todayMeals: MealCost[]
  dailyMeals: DailyMeal[]
  selectedDate: string
  isAdmin: boolean
}

interface EditingMeal {
  mealId?: string
  userId: string
  mealTime: 'Lunch' | 'Dinner'
  weight: number
  isNew: boolean
}

export default function MealTableClient({ 
  users, 
  mealTypes, 
  todayMeals, 
  dailyMeals,
  selectedDate,
  isAdmin 
}: MealTableClientProps) {
  const [date, setDate] = useState(selectedDate)
  const [isPending, startTransition] = useTransition()
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null)
  const [customWeight, setCustomWeight] = useState('')
  const [showCustomMealModal, setShowCustomMealModal] = useState<'Lunch' | 'Dinner' | null>(null)
  const [customMealName, setCustomMealName] = useState('')
  const [customMealWeight, setCustomMealWeight] = useState('')

  // Get the daily meal settings for lunch and dinner
  const lunchMeal = dailyMeals.find(dm => dm.meal_time === 'Lunch')
  const dinnerMeal = dailyMeals.find(dm => dm.meal_time === 'Dinner')
  
  const lunchType = mealTypes.find(mt => mt.id === lunchMeal?.meal_type_id)
  const dinnerType = mealTypes.find(mt => mt.id === dinnerMeal?.meal_type_id)

  // Get user's meal for a specific time
  const getUserMeal = (userId: string, mealTime: 'Lunch' | 'Dinner'): MealCost | undefined => {
    return todayMeals.find(m => m.user_id === userId && m.meal_type === mealTime)
  }

  // Count totals
  const lunchCount = users.filter(u => getUserMeal(u.id, 'Lunch')).length
  const dinnerCount = users.filter(u => getUserMeal(u.id, 'Dinner')).length
  const lunchTotal = todayMeals.filter(m => m.meal_type === 'Lunch').reduce((sum, m) => sum + Number(m.meal_weight), 0)
  const dinnerTotal = todayMeals.filter(m => m.meal_type === 'Dinner').reduce((sum, m) => sum + Number(m.meal_weight), 0)

  const allLunchSelected = lunchCount === users.length
  const allDinnerSelected = dinnerCount === users.length

  async function handleMealTypeChange(mealTime: 'Lunch' | 'Dinner', mealTypeId: string) {
    if (mealTypeId === 'custom') {
      setShowCustomMealModal(mealTime)
      return
    }
    startTransition(async () => {
      await setDailyMeal(date, mealTime, mealTypeId || null)
    })
  }

  async function handleCreateCustomMealType() {
    if (!customMealName.trim() || !customMealWeight || !showCustomMealModal) return
    
    startTransition(async () => {
      const result = await createMealType(customMealName.trim(), parseFloat(customMealWeight))
      if (result.success && result.mealType) {
        await setDailyMeal(date, showCustomMealModal, result.mealType.id)
      }
      setShowCustomMealModal(null)
      setCustomMealName('')
      setCustomMealWeight('')
    })
  }

  function openEditModal(userId: string, mealTime: 'Lunch' | 'Dinner') {
    const existingMeal = getUserMeal(userId, mealTime)
    const defaultWeight = mealTime === 'Lunch' ? (lunchType?.weight || 1) : (dinnerType?.weight || 1)
    
    setEditingMeal({
      mealId: existingMeal?.id,
      userId,
      mealTime,
      weight: existingMeal ? Number(existingMeal.meal_weight) : defaultWeight,
      isNew: !existingMeal
    })
    setCustomWeight(existingMeal ? String(existingMeal.meal_weight) : String(defaultWeight))
  }

  async function handleSaveMeal() {
    if (!editingMeal) return
    const parsedWeight = parseFloat(customWeight)
    // Allow 0, but fallback to 1 only if NaN
    const weight = isNaN(parsedWeight) ? 1 : parsedWeight

    startTransition(async () => {
      if (editingMeal.isNew) {
        await addMealWithWeight(editingMeal.userId, date, editingMeal.mealTime, weight)
      } else if (editingMeal.mealId) {
        await updateMealWeight(editingMeal.mealId, weight)
      }
      setEditingMeal(null)
    })
  }

  async function handleSkipMeal() {
    if (!editingMeal) return
    
    startTransition(async () => {
      if (editingMeal.isNew) {
        await addMealWithWeight(editingMeal.userId, date, editingMeal.mealTime, 0)
      } else if (editingMeal.mealId) {
        await updateMealWeight(editingMeal.mealId, 0)
      }
      setEditingMeal(null)
    })
  }

  async function handleDeleteMeal() {
    if (!editingMeal?.mealId) return

    startTransition(async () => {
      await deleteMealEntry(editingMeal.mealId!)
      setEditingMeal(null)
    })
  }

  async function handleToggleAll(mealTime: 'Lunch' | 'Dinner') {
    const isAllSelected = mealTime === 'Lunch' ? allLunchSelected : allDinnerSelected
    const weight = mealTime === 'Lunch' ? Number(lunchType?.weight || 1) : Number(dinnerType?.weight || 1)
    
    startTransition(async () => {
      await toggleAllMeals(date, mealTime, users.map(u => u.id), !isAllSelected, weight)
    })
  }

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || ''

  return (
    <Card className="overflow-hidden">
      {/* Card Header */}
      <CardHeader>
        <div className="flex items-center gap-100 justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <span>🍽️</span> 
            <span className="whitespace-nowrap">Daily Meal List</span>
          </CardTitle>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-2 text-sm"
          />
        </div>
      </CardHeader>
      
      {/* Meal Type Selection (Admin Only) */}
      {isAdmin && (
        <div className="px-6 pb-6">
          <div className="grid gap-6 sm:grid-cols-2 p-5 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-3">
              <Label className="text-sm font-medium block pb-1">Lunch Type</Label>
              <Select 
                value={lunchMeal?.meal_type_id || ''} 
                onValueChange={(val) => handleMealTypeChange('Lunch', val)}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="Select Meal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">Select Meal...</SelectItem>
                  {mealTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>{mt.name} ({mt.weight})</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-primary font-medium">➕ Custom Meal...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium block pb-1">Dinner Type</Label>
              <Select 
                value={dinnerMeal?.meal_type_id || ''} 
                onValueChange={(val) => handleMealTypeChange('Dinner', val)}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="Select Meal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">Select Meal...</SelectItem>
                  {mealTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>{mt.name} ({mt.weight})</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-primary font-medium">➕ Custom Meal...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Attendance Table */}
      <CardContent>
        <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-teal-50/50 dark:bg-teal-950/20">
              <TableRow className="hover:bg-transparent border-b border-teal-100 dark:border-teal-900/50">
                <TableHead className="w-[150px] font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Name</TableHead>
                <TableHead className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs tracking-wider">Lunch {lunchType ? `(${lunchType.weight})` : ''}</span>
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant={allLunchSelected ? "default" : "outline"}
                        className={cn(
                          "h-6 text-xs w-full max-w-[60px] transition-all",
                          allLunchSelected 
                            ? "bg-teal-600 hover:bg-teal-700 text-white border-transparent" 
                            : "text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                        )}
                        onClick={() => handleToggleAll('Lunch')}
                        disabled={isPending}
                      >
                        {allLunchSelected ? '✓ All' : 'All'}
                      </Button>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="font-bold text-orange-700 dark:text-orange-400 uppercase text-xs tracking-wider">Dinner {dinnerType ? `(${dinnerType.weight})` : ''}</span>
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant={allDinnerSelected ? "secondary" : "outline"}
                        className={cn(
                            "h-6 text-xs w-full max-w-[60px] transition-all",
                            allDinnerSelected 
                              ? "bg-orange-500 hover:bg-orange-600 text-white border-transparent" 
                              : "text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          )}
                        onClick={() => handleToggleAll('Dinner')}
                        disabled={isPending}
                      >
                         {allDinnerSelected ? '✓ All' : 'All'}
                      </Button>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const lunchMealEntry = getUserMeal(user.id, 'Lunch')
                const dinnerMealEntry = getUserMeal(user.id, 'Dinner')
                
                return (
                  <TableRow key={user.id} className="hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors border-b border-teal-50 dark:border-teal-900/30 last:border-0">
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-center">
                      {isAdmin ? (
                        <Button
                          variant={lunchMealEntry ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "w-12 h-8 font-bold transition-all shadow-sm",
                            lunchMealEntry 
                                ? "bg-teal-500 hover:bg-teal-600 text-white" 
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => openEditModal(user.id, 'Lunch')}
                          disabled={isPending}
                        >
                          {lunchMealEntry ? lunchMealEntry.meal_weight : '—'}
                        </Button>
                      ) : (
                        <span className={cn(
                          "font-bold inline-flex items-center justify-center w-8 h-8 rounded-full text-sm",
                          lunchMealEntry 
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" 
                            : "text-muted-foreground/30"
                        )}>
                          {lunchMealEntry ? lunchMealEntry.meal_weight : '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isAdmin ? (
                        <Button
                          variant={dinnerMealEntry ? "secondary" : "secondary"}
                          size="sm"
                          className={cn(
                            "w-12 h-8 font-bold transition-all shadow-sm",
                            dinnerMealEntry 
                                ? "bg-orange-500 hover:bg-orange-600 text-white" 
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => openEditModal(user.id, 'Dinner')}
                          disabled={isPending}
                        >
                          {dinnerMealEntry ? dinnerMealEntry.meal_weight : '—'}
                        </Button>
                      ) : (
                        <span className={cn(
                            "font-bold inline-flex items-center justify-center w-8 h-8 rounded-full text-sm",
                            dinnerMealEntry 
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" 
                              : "text-muted-foreground/30"
                          )}>
                          {dinnerMealEntry ? dinnerMealEntry.meal_weight : '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-teal-50/50 dark:bg-teal-900/20 font-bold border-t border-teal-100 dark:border-teal-900">
                <TableCell className="text-teal-900 dark:text-teal-100">Total</TableCell>
                <TableCell className="text-center text-teal-700 dark:text-teal-400 font-bold text-lg">{lunchTotal} <span className="text-xs text-muted-foreground font-normal ml-1">({lunchCount})</span></TableCell>
                <TableCell className="text-center text-orange-700 dark:text-orange-400 font-bold text-lg">{dinnerTotal} <span className="text-xs text-muted-foreground font-normal ml-1">({dinnerCount})</span></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>

      {/* Edit Modal (Dialog) */}
      <Dialog open={!!editingMeal} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingMeal && `${getUserName(editingMeal.userId)} - ${editingMeal.mealTime}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="weight">Meal Weight</Label>
              <Input
                id="weight"
                type="number"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                min="0"
                step="0.5"
                className="text-center text-lg h-12"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Increase for guests (e.g., 2 people = {(parseFloat(customWeight) || 0) * 2})
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
             {!editingMeal?.isNew && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteMeal}
                disabled={isPending}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            {editingMeal?.isNew && (
              <Button 
                variant="secondary" 
                onClick={handleSkipMeal}
                disabled={isPending}
                className="mr-auto text-muted-foreground hover:text-foreground"
                type="button"
              >
                Skip Meal (0)
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingMeal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMeal} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Meal Type Modal (Dialog) */}
      <Dialog open={!!showCustomMealModal} onOpenChange={(open) => !open && setShowCustomMealModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>➕ Add New Meal Type</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Meal Name</Label>
              <Input
                id="name"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="e.g. Beef Tehari"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom-weight">Default Weight</Label>
              <Input
                id="custom-weight"
                type="number"
                value={customMealWeight}
                onChange={(e) => setCustomMealWeight(e.target.value)}
                min="1"
                step="0.1"
                placeholder="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomMealModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCustomMealType} 
              disabled={isPending || !customMealName.trim() || !customMealWeight}
            >
              {isPending ? 'Adding...' : 'Add Meal Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
