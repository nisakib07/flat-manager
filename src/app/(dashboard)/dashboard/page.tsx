import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  // Fetch current month data
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  
  // Fetch users count
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  // Fetch this month's meal costs
  const { data: mealCosts } = await supabase
    .from('meal_costs')
    .select('cost')
    .gte('meal_date', currentMonth)
  
  const totalMealCost = mealCosts?.reduce((sum, m) => sum + Number(m.cost), 0) || 0
  
  // Fetch this month's utility expenses
  const { data: utilities } = await supabase
    .from('utility_expenses')
    .select('amount')
    .eq('month', currentMonth)
  
  const totalUtilities = utilities?.reduce((sum, u) => sum + Number(u.amount), 0) || 0
  
  // Fetch this month's shopping
  const { data: shopping } = await supabase
    .from('bajar_list')
    .select('cost')
    .gte('purchase_date', currentMonth)
  
  const totalShopping = shopping?.reduce((sum, s) => sum + Number(s.cost), 0) || 0
  
  // Fetch user's balance
  const { data: balance } = await supabase
    .from('monthly_balances')
    .select('*')
    .eq('user_id', authUser?.id)
    .eq('month', currentMonth)
    .single()
  
  // Recent shopping items
  const { data: recentShopping } = await supabase
    .from('bajar_list')
    .select('*, user:users(name)')
    .order('purchase_date', { ascending: false })
    .limit(5)
  
  // Recent meals
  const { data: recentMeals } = await supabase
    .from('meal_costs')
    .select('*, user:users(name)')
    .order('meal_date', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your flat expenses for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid-stats">
        <div className="stat-card">
          <span className="stat-label">Total Flatmates</span>
          <span className="stat-value">{usersCount || 0}</span>
          <Link href="/users" className="text-sm" style={{ color: 'var(--primary)' }}>Manage users →</Link>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Meal Costs</span>
          <span className="stat-value">৳{totalMealCost.toLocaleString()}</span>
          <Link href="/meals" className="text-sm" style={{ color: 'var(--primary)' }}>View details →</Link>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Shopping</span>
          <span className="stat-value">৳{totalShopping.toLocaleString()}</span>
          <Link href="/shopping" className="text-sm" style={{ color: 'var(--primary)' }}>View list →</Link>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Utilities</span>
          <span className="stat-value">৳{totalUtilities.toLocaleString()}</span>
          <Link href="/utilities" className="text-sm" style={{ color: 'var(--primary)' }}>View details →</Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white/80">Your Balance</h3>
            <p className="text-3xl font-bold text-white">
              ৳{balance?.meal_balance?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/deposits" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              Add Deposit
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Shopping */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Shopping</h3>
            <Link href="/shopping" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>View all</Link>
          </div>
          
          {recentShopping && recentShopping.length > 0 ? (
            <div className="space-y-3">
              {recentShopping.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.item_name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {(item.user as { name: string })?.name || 'Unknown'} • {new Date(item.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>৳{item.cost}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No shopping items yet</p>
            </div>
          )}
        </div>

        {/* Recent Meals */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Meals</h3>
            <Link href="/meals" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>View all</Link>
          </div>
          
          {recentMeals && recentMeals.length > 0 ? (
            <div className="space-y-3">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {meal.meal_type} - {(meal.user as { name: string })?.name || 'Unknown'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(meal.meal_date).toLocaleDateString()} • Weight: {meal.meal_weight}
                    </p>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>৳{meal.cost}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>No meals recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
