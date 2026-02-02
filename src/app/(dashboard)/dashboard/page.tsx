import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MealTableClient from './MealTableClient'
import MealCalculation from './MealCalculation'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Today's date for meal table
  const today = new Date().toISOString().split('T')[0]
  
  // Fetch current month data
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  
  // Fetch current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', authUser?.id)
    .single()
  
  const isAdmin = currentUser?.role === 'admin'
  
  // Fetch all users for meal table
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  // Fetch meal types
  const { data: mealTypes } = await supabase
    .from('meal_types')
    .select('*')
    .order('name')
  
  // Fetch today's meal attendance
  const { data: todayMeals } = await supabase
    .from('meal_costs')
    .select('*')
    .eq('meal_date', today)
  
  // Fetch today's daily meal settings
  const { data: dailyMeals } = await supabase
    .from('daily_meals')
    .select('*, meal_type:meal_types(*)')
    .eq('meal_date', today)
  
  // Fetch this month's meal costs (full data for calculation)
  const { data: monthlyMealCosts } = await supabase
    .from('meal_costs')
    .select('*')
    .gte('meal_date', currentMonth)
  
  // Fetch this month's common expenses
  const { data: commonExpenses } = await supabase
    .from('common_expenses')
    .select('*')
    .gte('month', currentMonth)

  // Fetch this month's meal deposits
  const { data: mealDeposits } = await supabase
    .from('meal_deposits')
    .select('*')
    .eq('month', currentMonth)

  // Fetch this month's shopping (full data for calculation)
  const { data: monthlyBajar } = await supabase
    .from('bajar_list')
    .select('*')
    .gte('purchase_date', currentMonth)
  
  const totalShopping = monthlyBajar?.reduce((sum, s) => sum + Number(s.cost), 0) || 0
  
  // Recent shopping items
  const { data: recentShopping } = await supabase
    .from('bajar_list')
    .select('*, user:users(name)')
    .order('purchase_date', { ascending: false })
    .limit(5)

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  return (
    <div className="space-y-8 animate-fadeIn pb-24 lg:pb-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome, {currentUser?.name || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Mess overview for {monthLabel}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Meal Table (spans 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Meal Table - Main Feature */}
          <MealTableClient
            users={users || []}
            mealTypes={mealTypes || []}
            todayMeals={todayMeals || []}
            dailyMeals={dailyMeals || []}
            selectedDate={today}
            isAdmin={isAdmin}
          />

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

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-xl">⚡</span> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all"
                asChild
              >
                <Link href="/shopping">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🛒</div>
                  <div className="text-left">
                    <div className="font-semibold">Add Shopping</div>
                    <div className="text-muted-foreground text-xs">
                      Total: ৳{totalShopping.toLocaleString()}
                    </div>
                  </div>
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all"
                asChild
              >
                <Link href="/deposits">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💰</div>
                  <div className="text-left">
                    <div className="font-semibold">Make Deposit</div>
                    <div className="text-muted-foreground text-xs">Add funds</div>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30 group transition-all"
                asChild
              >
                <Link href="/users">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👥</div>
                  <div className="text-left">
                    <div className="font-semibold">Members</div>
                    <div className="text-muted-foreground text-xs">
                      {users?.length || 0} flatmates
                    </div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Shopping */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-xl">🛍️</span> Recent Shopping
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-xs" asChild>
                <Link href="/shopping">See All</Link>
              </Button>
            </CardHeader>
            
            <CardContent>
              {recentShopping && recentShopping.length > 0 ? (
                <div className="space-y-3">
                  {recentShopping.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-sm leading-none truncate">
                          {item.item_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(item.user as { name: string })?.name} • {new Date(item.purchase_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-primary ml-3 whitespace-nowrap">৳{item.cost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <span className="text-3xl mb-2">🛒</span>
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
