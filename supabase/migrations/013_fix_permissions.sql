-- 13. Fix Missing Permissions and RLS

-- 1. Fix permissions for meal_types (missed in 012)
DROP POLICY IF EXISTS "Admins can manage meal types" ON public.meal_types;
CREATE POLICY "Admins and Super Admins can manage meal types" ON public.meal_types
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 2. Fix permissions for daily_meals (missed in 012)
DROP POLICY IF EXISTS "Admins can manage daily meals" ON public.daily_meals;
CREATE POLICY "Admins and Super Admins can manage daily meals" ON public.daily_meals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 3. Fix permissions for utility_collections (missed in 012)
-- We need to drop the specific granular policies created in 003
DROP POLICY IF EXISTS "Enable insert for admins" ON public.utility_collections;
DROP POLICY IF EXISTS "Enable update for admins" ON public.utility_collections;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.utility_collections;

-- Create a unified policy for consistency (or recreate granular ones if preferred, unified is easier)
CREATE POLICY "Admins and Super Admins can manage utility collections" ON public.utility_collections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 4. Secure fund_transfers table (created in 006 without RLS)
ALTER TABLE public.fund_transfers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view transfers (needed for transparency/calculations on client)
CREATE POLICY "Anyone can view fund transfers" ON public.fund_transfers
    FOR SELECT USING (true);

-- Allow Admins and Super Admins to manage transfers
CREATE POLICY "Admins and Super Admins can manage fund transfers" ON public.fund_transfers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
