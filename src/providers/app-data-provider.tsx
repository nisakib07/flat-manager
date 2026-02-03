'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import type { User, MealType, MealCost, DailyMeal, BajarItem, CommonExpense, MealDeposit, UtilityExpense, UtilityCollection } from '@/types/database'

interface DashboardData {
  users: User[]
  mealTypes: MealType[]
  todayMeals: MealCost[]
  dailyMeals: any[]
  monthlyMealCosts: MealCost[]
  commonExpenses: CommonExpense[]
  mealDeposits: MealDeposit[]
  monthlyBajar: BajarItem[]
  recentShopping: any[]
  currentUser: { role: string; name: string } | null
  isAdmin: boolean
}

interface AppDataContextType {
  dashboardData: DashboardData | null
  shoppingData: { users: User[]; items: any[]; isAdmin: boolean } | null
  utilitiesData: { users: User[]; utilityCollections: UtilityCollection[]; utilityExpenses: UtilityExpense[]; isAdmin: boolean; selectedMonth: string } | null
  setDashboardData: (data: DashboardData) => void
  setShoppingData: (data: any) => void
  setUtilitiesData: (data: any) => void
  invalidate: (key: 'dashboard' | 'shopping' | 'utilities' | 'all') => void
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [shoppingData, setShoppingData] = useState<any>(null)
  const [utilitiesData, setUtilitiesData] = useState<any>(null)

  const invalidate = (key: 'dashboard' | 'shopping' | 'utilities' | 'all') => {
    if (key === 'dashboard' || key === 'all') setDashboardData(null)
    if (key === 'shopping' || key === 'all') setShoppingData(null)
    if (key === 'utilities' || key === 'all') setUtilitiesData(null)
  }

  return (
    <AppDataContext.Provider
      value={{
        dashboardData,
        shoppingData,
        utilitiesData,
        setDashboardData,
        setShoppingData,
        setUtilitiesData,
        invalidate,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within AppDataProvider')
  }
  return context
}
