-- Flat Manager App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal deposits table
CREATE TABLE IF NOT EXISTS public.meal_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    deposit NUMERIC NOT NULL DEFAULT 0,
    carry_forward NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Meal costs table
CREATE TABLE IF NOT EXISTS public.meal_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('Lunch', 'Dinner')),
    meal_weight NUMERIC NOT NULL DEFAULT 1,
    cost NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Utility expenses table
CREATE TABLE IF NOT EXISTS public.utility_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Common expenses table
CREATE TABLE IF NOT EXISTS public.common_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_name TEXT NOT NULL,
    total_cost NUMERIC NOT NULL,
    user_share NUMERIC NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bajar (shopping) list table
CREATE TABLE IF NOT EXISTS public.bajar_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly balances table
CREATE TABLE IF NOT EXISTS public.monthly_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    meal_balance NUMERIC NOT NULL DEFAULT 0,
    utility_balance NUMERIC NOT NULL DEFAULT 0,
    carry_forward NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bajar_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for meal_deposits
CREATE POLICY "Anyone can view meal deposits" ON public.meal_deposits
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meal deposits" ON public.meal_deposits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for meal_costs
CREATE POLICY "Anyone can view meal costs" ON public.meal_costs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meal costs" ON public.meal_costs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for utility_expenses
CREATE POLICY "Anyone can view utility expenses" ON public.utility_expenses
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage utility expenses" ON public.utility_expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for common_expenses
CREATE POLICY "Anyone can view common expenses" ON public.common_expenses
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage common expenses" ON public.common_expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for bajar_list
CREATE POLICY "Anyone can view bajar list" ON public.bajar_list
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage bajar list" ON public.bajar_list
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for monthly_balances
CREATE POLICY "Anyone can view monthly balances" ON public.monthly_balances
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage monthly balances" ON public.monthly_balances
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        CASE 
            WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 'admin'
            ELSE 'viewer'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
