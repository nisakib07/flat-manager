import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MealTableClient from './MealTableClient'
import MealCalculation from './MealCalculation'
import PersonalSummaryCard from './PersonalSummaryCard'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Extended caching - 5 minutes for instant tab switching
export const revalidate = 300

type Props = {
  searchParams: Promise<{ date?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Determine selected date (from URL or default to today)
  const now = new Date()
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const selectedDate = resolvedSearchParams.date || todayDate

  // Ensure validity (fallback to today if invalid)
  const dateObj = new Date(selectedDate)
  const isValidDate = !isNaN(dateObj.getTime())
  const activeDate = isValidDate ? selectedDate : todayDate
  
  // Extract month from the ACTIVE DATE to ensure meal calculation matches the view
  const activeYear = dateObj.getFullYear()
  const activeMonthStr = String(dateObj.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${activeYear}-${activeMonthStr}-01`
  
  // PARALLEL QUERIES - Execute all queries simultaneously for 70-80% faster loading!
  const [
    currentUserResult,
    usersResult,
    mealTypesResult,
    todayMealsResult,
    dailyMealsResult,
    monthlyMealCostsResult,
    commonExpensesResult,
    mealDepositsResult,
    monthlyBajarResult,
    recentShoppingResult
  ] = await Promise.all([
    // Only select needed fields (not *) for faster queries
    supabase
      .from('users')
      .select('role, name')
      .eq('id', authUser?.id)
      .single(),
    
    supabase
      .from('users')
      .select('*')
      .order('name'),
    
    supabase
      .from('meal_types')
      .select('*')
      .order('name'),
    
    supabase
      .from('meal_costs')
      .select('*')
      .eq('meal_date', activeDate),
    
    supabase
      .from('daily_meals')
      .select('*, meal_type:meal_types(*)')
      .eq('meal_date', activeDate),
    
    supabase
      .from('meal_costs')
      .select('*')
      .gte('meal_date', currentMonth),
    
    supabase
      .from('common_expenses')
      .select('*')
      .gte('month', currentMonth),
    
    supabase
      .from('meal_deposits')
      .select('*')
      .eq('month', currentMonth),
    
    supabase
      .from('bajar_list')
      .select('*')
      .gte('purchase_date', currentMonth),
    
    supabase
      .from('bajar_list')
      .select('id, item_name, cost, purchase_date, user:users(name)')
      .order('purchase_date', { ascending: false })
      .limit(5)
  ])
  
  // Extract data from results
  const currentUser = currentUserResult.data
  const users = usersResult.data
  const mealTypes = mealTypesResult.data
  const todayMeals = todayMealsResult.data
  const dailyMeals = dailyMealsResult.data
  const monthlyMealCosts = monthlyMealCostsResult.data
  const commonExpenses = commonExpensesResult.data
  const mealDeposits = mealDepositsResult.data
  const monthlyBajar = monthlyBajarResult.data
  const recentShopping = recentShoppingResult.data
  
  const isAdmin = currentUser?.role === 'admin'
  const totalShopping = monthlyBajar?.reduce((sum, s) => sum + Number(s.cost), 0) || 0

  const monthLabel = new Date(activeDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-fadeIn w-full max-w-full">
      {/* Page Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome, {currentUser?.name || 'User'}! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Mess overview for {monthLabel}
        </p>
      </div>

      {/* Main Content Grid - Mobile First */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Left Column - Meal Table (spans 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Meal Table - Admin Only */}
          {isAdmin && (
            <MealTableClient
              users={users || []}
              mealTypes={mealTypes || []}
              todayMeals={todayMeals || []}
              dailyMeals={dailyMeals || []}
              selectedDate={activeDate}
              isAdmin={isAdmin}
            />
          )}

          {/* Meal Cost Calculation */}
          <MealCalculation
            users={users || []}
            mealCosts={monthlyMealCosts || []}
            bajarItems={monthlyBajar || []}
            commonExpenses={commonExpenses || []}
            mealDeposits={mealDeposits || []}
            monthLabel={monthLabel}
          />
        </div>

        {/* Right Column - Sidebar (stacks below on mobile) */}
        <div className="space-y-4 sm:space-y-6">
          <PersonalSummaryCard 
            currentUserId={authUser?.id}
            users={users || []}
            mealCosts={monthlyMealCosts || []}
            bajarItems={monthlyBajar || []}
            commonExpenses={commonExpenses || []}
            mealDeposits={mealDeposits || []}
          />

          {/* Quick Actions - Admin Only */}
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span className="text-lg sm:text-xl">⚡</span> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-auto min-h-[56px] sm:min-h-[64px] py-3 sm:py-4 px-3 sm:px-4 justify-start gap-3 sm:gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all active:scale-[0.98]"
                  asChild
                >
                  <Link href="/shopping">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shrink-0">🛒</div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base">Add Shopping</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        Total: ৳{totalShopping.toLocaleString()}
                      </div>
                    </div>
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-auto min-h-[56px] sm:min-h-[64px] py-3 sm:py-4 px-3 sm:px-4 justify-start gap-3 sm:gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all active:scale-[0.98]"
                  asChild
                >
                  <Link href="/deposits">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shrink-0">💰</div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base">Make Deposit</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Add funds</div>
                    </div>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-auto min-h-[56px] sm:min-h-[64px] py-3 sm:py-4 px-3 sm:px-4 justify-start gap-3 sm:gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all active:scale-[0.98]"
                  asChild
                >
                  <Link href="/users">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shrink-0">👥</div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base">Members</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        {users?.length || 0} flatmates
                      </div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Shopping */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="text-lg sm:text-xl">🛍️</span> Recent Shopping
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-xs h-8 px-2" asChild>
                <Link href="/shopping">See All</Link>
              </Button>
            </CardHeader>
            
            <CardContent>
              {recentShopping && recentShopping.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recentShopping.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors active:scale-[0.98]"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base leading-none">
                          {item.item_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(item.user as any)?.name} • {new Date(item.purchase_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="font-bold text-sm sm:text-base text-primary ml-3 whitespace-nowrap shrink-0">৳{item.cost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-muted-foreground">
                  <span className="text-3xl sm:text-4xl mb-2">🛒</span>
                  <p className="text-sm">No shopping items yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
