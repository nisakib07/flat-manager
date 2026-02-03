export type UserRole = 'admin' | 'viewer'
export type MealType = 'Lunch' | 'Dinner'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface MealDeposit {
  id: string
  user_id: string
  month: string
  d1: number
  d2: number
  d3: number
  d4: number
  d5: number
  d6: number
  d7: number
  d8: number
  carry_forward: number
  created_at: string
}

export interface MealCost {
  id: string
  user_id: string
  meal_date: string
  meal_type: MealType
  meal_weight: number
  cost: number
  created_at: string
  user?: User
}

export interface UtilityExpense {
  id: string
  expense_type: string
  amount: number
  month: string
  created_at: string
}

export interface CommonExpense {
  id: string
  expense_name: string
  total_cost: number
  user_share: number
  month: string
  created_at: string
}

export interface BajarItem {
  id: string
  user_id: string
  item_name: string
  cost: number
  purchase_date: string
  created_at: string
  user?: User
}

export interface MonthlyBalance {
  id: string
  user_id: string
  month: string
  meal_balance: number
  utility_balance: number
  carry_forward: number
  created_at: string
  user?: User
}

export interface MealTypeItem {
  id: string
  name: string
  weight: number
  created_at: string
}

export interface DailyMeal {
  id: string
  meal_date: string
  meal_time: 'Lunch' | 'Dinner'
  meal_type_id: string | null
  created_at: string
  meal_type?: MealTypeItem
}

export interface UtilityCollection {
  id: string
  month: string
  utility_type: string
  user_id: string
  amount: number
  created_at: string
}

export interface FundTransfer {
  id: string
  amount: number
  shopper_id: string
  transfer_date: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      meal_deposits: {
        Row: MealDeposit
        Insert: Omit<MealDeposit, 'id' | 'created_at'>
        Update: Partial<Omit<MealDeposit, 'id' | 'created_at'>>
      }
      meal_costs: {
        Row: MealCost
        Insert: Omit<MealCost, 'id' | 'created_at'>
        Update: Partial<Omit<MealCost, 'id' | 'created_at'>>
      }
      utility_expenses: {
        Row: UtilityExpense
        Insert: Omit<UtilityExpense, 'id' | 'created_at'>
        Update: Partial<Omit<UtilityExpense, 'id' | 'created_at'>>
      }
      utility_collections: {
        Row: UtilityCollection
        Insert: Omit<UtilityCollection, 'id' | 'created_at'>
        Update: Partial<Omit<UtilityCollection, 'id' | 'created_at'>>
      }
      common_expenses: {
        Row: CommonExpense
        Insert: Omit<CommonExpense, 'id' | 'created_at'>
        Update: Partial<Omit<CommonExpense, 'id' | 'created_at'>>
      }
      bajar_list: {
        Row: BajarItem
        Insert: Omit<BajarItem, 'id' | 'created_at'>
        Update: Partial<Omit<BajarItem, 'id' | 'created_at'>>
      }
      monthly_balances: {
        Row: MonthlyBalance
        Insert: Omit<MonthlyBalance, 'id' | 'created_at'>
        Update: Partial<Omit<MonthlyBalance, 'id' | 'created_at'>>
      }
      fund_transfers: {
        Row: FundTransfer
        Insert: Omit<FundTransfer, 'id' | 'created_at'>
        Update: Partial<Omit<FundTransfer, 'id' | 'created_at'>>
      }
    }
  }
}
