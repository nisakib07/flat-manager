'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { 
  setDailyMeal, 
  addMealWithWeight,
  updateMealWeight, 
  deleteMealEntry,
  toggleAllMeals,
  toggleUserMealAttendance,
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
import { Card, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format, parse } from 'date-fns'
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Moon, Sun, Utensils, Check, X, Users, Calendar as CalendarIcon } from 'lucide-react'

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
  userName: string
  mealTime: 'Lunch' | 'Dinner'
  currentWeight: number
  isNew: boolean
}

const LONG_PRESS_DURATION = 400 // ms

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
  const [loadingCell, setLoadingCell] = useState<string | null>(null) // "userId-mealTime"
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null)
  const [customWeight, setCustomWeight] = useState('')
  const [showCustomMealModal, setShowCustomMealModal] = useState<'Lunch' | 'Dinner' | null>(null)
  const [customMealName, setCustomMealName] = useState('')
  const [customMealWeight, setCustomMealWeight] = useState('')
  
  // Long press tracking
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

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

  // Meal type change handler
  async function handleMealTypeChange(mealTime: 'Lunch' | 'Dinner', mealTypeId: string) {
    if (mealTypeId === 'custom') {
      setShowCustomMealModal(mealTime)
      return
    }
    startTransition(async () => {
      // "_empty" or empty string means clear the selection
      const typeId = (mealTypeId === '_empty' || !mealTypeId) ? null : mealTypeId
      await setDailyMeal(date, mealTime, typeId)
    })
  }

  // Create custom meal type
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

  // SINGLE TAP: Toggle meal on/off at default weight
  const handleTapToggle = useCallback(async (userId: string, mealTime: 'Lunch' | 'Dinner') => {
    if (!isAdmin) return
    
    const cellKey = `${userId}-${mealTime}`
    const existingMeal = getUserMeal(userId, mealTime)
    const defaultWeight = mealTime === 'Lunch' ? Number(lunchType?.weight || 1) : Number(dinnerType?.weight || 1)
    
    setLoadingCell(cellKey)
    
    startTransition(async () => {
      await toggleUserMealAttendance(userId, date, mealTime, defaultWeight)
      setLoadingCell(null)
    })
  }, [isAdmin, date, lunchType, dinnerType, todayMeals])

  // LONG PRESS: Open weight editor modal
  const openWeightEditor = useCallback((userId: string, mealTime: 'Lunch' | 'Dinner') => {
    const existingMeal = getUserMeal(userId, mealTime)
    const defaultWeight = mealTime === 'Lunch' ? (lunchType?.weight || 1) : (dinnerType?.weight || 1)
    const userName = users.find(u => u.id === userId)?.name || ''
    
    setEditingMeal({
      mealId: existingMeal?.id,
      userId,
      userName,
      mealTime,
      currentWeight: existingMeal ? Number(existingMeal.meal_weight) : defaultWeight,
      isNew: !existingMeal
    })
    setCustomWeight(existingMeal ? String(existingMeal.meal_weight) : '')
  }, [users, lunchType, dinnerType, todayMeals])

  // Long press handlers
  const handlePressStart = useCallback((userId: string, mealTime: 'Lunch' | 'Dinner') => {
    if (!isAdmin) return
    
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      openWeightEditor(userId, mealTime)
    }, LONG_PRESS_DURATION)
  }, [isAdmin, openWeightEditor])

  const handlePressEnd = useCallback((userId: string, mealTime: 'Lunch' | 'Dinner') => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    // If it wasn't a long press, treat as tap
    if (!isLongPress.current && isAdmin) {
      handleTapToggle(userId, mealTime)
    }
    isLongPress.current = false
  }, [isAdmin, handleTapToggle])

  const handlePressCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    isLongPress.current = false
  }, [])

  // Save weight from modal
  async function handleSaveWeight() {
    if (!editingMeal) return
    const parsedWeight = parseFloat(customWeight)
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

  // Delete meal from modal
  async function handleDeleteMeal() {
    if (!editingMeal?.mealId) return

    startTransition(async () => {
      await deleteMealEntry(editingMeal.mealId!)
      setEditingMeal(null)
    })
  }

  // Toggle all users
  async function handleToggleAll(mealTime: 'Lunch' | 'Dinner') {
    const isAllSelected = mealTime === 'Lunch' ? allLunchSelected : allDinnerSelected
    const weight = mealTime === 'Lunch' ? Number(lunchType?.weight || 1) : Number(dinnerType?.weight || 1)
    
    startTransition(async () => {
      await toggleAllMeals(date, mealTime, users.map(u => u.id), !isAllSelected, weight)
    })
  }

  // Render meal cell
  const MealCell = ({ userId, mealTime }: { userId: string, mealTime: 'Lunch' | 'Dinner' }) => {
    const meal = getUserMeal(userId, mealTime)
    const cellKey = `${userId}-${mealTime}`
    const isLoading = loadingCell === cellKey
    const isLunch = mealTime === 'Lunch'
    const hasMeal = !!meal && Number(meal.meal_weight) > 0
    
    return (
      <button
        type="button"
        disabled={!isAdmin || isPending}
        onMouseDown={() => handlePressStart(userId, mealTime)}
        onMouseUp={() => handlePressEnd(userId, mealTime)}
        onMouseLeave={handlePressCancel}
        onTouchStart={() => handlePressStart(userId, mealTime)}
        onTouchEnd={() => handlePressEnd(userId, mealTime)}
        onTouchCancel={handlePressCancel}
        className={cn(
          "w-full h-10 sm:h-9 rounded-lg font-bold text-sm transition-all duration-150 flex items-center justify-center gap-1",
          "select-none touch-manipulation",
          !isAdmin && "cursor-default",
          isAdmin && "cursor-pointer active:scale-95",
          isLoading && "opacity-50 animate-pulse",
          hasMeal 
            ? isLunch 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm" 
              : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        )}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : hasMeal ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>{meal.meal_weight}</span>
          </>
        ) : (
          <X className="w-4 h-4 opacity-50" />
        )}
      </button>
    )
  }

  return (
    <Card className="overflow-hidden bg-background border-none shadow-none sm:border sm:shadow-sm w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between gap-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 shrink-0">
          <Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <span className="hidden sm:inline">Daily Meals</span>
          <span className="sm:hidden">Meals</span>
        </CardTitle>
       
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "h-9 w-[150px] sm:w-[170px] justify-start text-left font-normal bg-muted/20 border-muted-foreground/20 hover:bg-muted/30",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
              {date ? format(parse(date, 'yyyy-MM-dd', new Date()), 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(format(newDate, 'yyyy-MM-dd'))
                }
              }}
              initialFocus
              disabled={(d) => d > new Date() || d < new Date("2024-01-01")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Meal Type Selection (Admin Only) */}
      {isAdmin && (
        <div className="px-3 py-3 border-b bg-muted/20">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 w-16">
                <Sun className="h-3.5 w-3.5" /> Lunch
              </div>
              <Select 
                value={lunchMeal?.meal_type_id || ''} 
                onValueChange={(val) => handleMealTypeChange('Lunch', val)}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">Select...</SelectItem>
                  {mealTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>{mt.name} ({mt.weight})</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-primary font-medium">+ Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 w-16">
                <Moon className="h-3.5 w-3.5" /> Dinner
              </div>
              <Select 
                value={dinnerMeal?.meal_type_id || ''} 
                onValueChange={(val) => handleMealTypeChange('Dinner', val)}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">Select...</SelectItem>
                  {mealTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>{mt.name} ({mt.weight})</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-primary font-medium">+ Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-none">
        <Table className="min-w-[320px]">
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] sm:w-[150px] font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="w-[100px] sm:w-[120px] text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">
                    Lunch
                  </span>
                  {lunchType && <span className="text-[10px] text-muted-foreground">({lunchType.weight})</span>}
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={cn(
                        "h-6 text-[10px] px-2",
                        allLunchSelected 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "text-muted-foreground"
                      )}
                      onClick={() => handleToggleAll('Lunch')}
                      disabled={isPending}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      {allLunchSelected ? 'All ✓' : 'All'}
                    </Button>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[100px] sm:w-[120px] text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                    Dinner
                  </span>
                  {dinnerType && <span className="text-[10px] text-muted-foreground">({dinnerType.weight})</span>}
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={cn(
                        "h-6 text-[10px] px-2",
                        allDinnerSelected 
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                          : "text-muted-foreground"
                      )}
                      onClick={() => handleToggleAll('Dinner')}
                      disabled={isPending}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      {allDinnerSelected ? 'All ✓' : 'All'}
                    </Button>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <TableCell className="font-medium text-sm py-2">{user.name}</TableCell>
                <TableCell className="py-2 px-2">
                  <MealCell userId={user.id} mealTime="Lunch" />
                </TableCell>
                <TableCell className="py-2 px-2">
                  <MealCell userId={user.id} mealTime="Dinner" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-slate-100 dark:bg-slate-900/70">
            <TableRow>
              <TableCell className="font-bold text-slate-700 dark:text-slate-200 py-3">Total</TableCell>
              <TableCell className="text-center py-3">
                <div className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                  {lunchTotal}
                </div>
              </TableCell>
              <TableCell className="text-center py-3">
                <div className="font-black text-lg text-amber-600 dark:text-amber-400">
                  {dinnerTotal}
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Hint for admins */}
      {isAdmin && (
        <div className="px-3 py-2 text-center text-[10px] text-muted-foreground border-t bg-muted/10">
          <span className="hidden sm:inline">Tap to toggle • Long-press to set custom weight</span>
          <span className="sm:hidden">Tap = toggle • Hold = edit weight</span>
        </div>
      )}

      {/* Weight Editor Modal */}
      <Dialog open={!!editingMeal} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                editingMeal?.mealTime === 'Lunch' ? "bg-emerald-500" : "bg-amber-500"
              )} />
              {editingMeal?.userName} — {editingMeal?.mealTime}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="weight" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Meal Weight
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 w-12 text-lg"
                onClick={() => setCustomWeight(String(Math.max(0, parseFloat(customWeight || '0') - 0.5)))}
              >
                −
              </Button>
              <Input
                id="weight"
                type="number"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                min="0"
                step="0.5"
                className="text-center text-2xl h-12 font-bold flex-1"
                autoFocus
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 w-12 text-lg"
                onClick={() => setCustomWeight(String(parseFloat(customWeight || '0') + 0.5))}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              0 = hasn't eaten • 2 = with guest
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {!editingMeal?.isNew && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteMeal}
                disabled={isPending}
                className="mr-auto"
              >
                Remove
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditingMeal(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveWeight} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Meal Type Modal */}
      <Dialog open={!!showCustomMealModal} onOpenChange={(open) => !open && setShowCustomMealModal(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Add New Meal Type</DialogTitle>
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
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
