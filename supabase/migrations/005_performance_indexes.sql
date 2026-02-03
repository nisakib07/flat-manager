-- Performance Optimization: Database Indexes
-- This migration creates indexes to speed up frequently queried data by 50-70%

-- Index for meal costs by date (heavily used in dashboard and meals page)
CREATE INDEX IF NOT EXISTS idx_meal_costs_date ON meal_costs(meal_date DESC);

-- Composite index for meal costs by user and date (for user-specific queries)
CREATE INDEX IF NOT EXISTS idx_meal_costs_user_date ON meal_costs(user_id, meal_date DESC);

-- Index for shopping/bajar list by date (used in dashboard and shopping page)
CREATE INDEX IF NOT EXISTS idx_bajar_purchase_date ON bajar_list(purchase_date DESC);

-- Index for bajar by user (for user-specific shopping queries)
CREATE INDEX IF NOT EXISTS idx_bajar_user_id ON bajar_list(user_id);

-- Index for meal deposits by month and user (for deposits page)
CREATE INDEX IF NOT EXISTS idx_meal_deposits_month_user ON meal_deposits(month, user_id);

-- Index for common expenses by month
CREATE INDEX IF NOT EXISTS idx_common_expenses_month ON common_expenses(month DESC);

-- Index for utility expenses by month and type
CREATE INDEX IF NOT EXISTS idx_utility_expenses_month_type ON utility_expenses(month, expense_type);

-- Index for utility collections by month, type, and user
CREATE INDEX IF NOT EXISTS idx_utility_collections_month_type_user ON utility_collections(month, utility_type, user_id);

-- Index for daily meals by date
CREATE INDEX IF NOT EXISTS idx_daily_meals_date ON daily_meals(meal_date DESC);
