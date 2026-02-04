-- 12. Add Super Admin Role and Permissions

-- 1. Update the check constraint to allow 'super_admin'
-- We verify the constraint name usually is distinct, but for simplicity we drop the check on the column
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'viewer', 'super_admin'));

-- 2. Update RLS policies for global access (admin OR super_admin)

-- meal_deposits
DROP POLICY IF EXISTS "Admins can manage meal deposits" ON public.meal_deposits;
CREATE POLICY "Admins and Super Admins can manage meal deposits" ON public.meal_deposits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- meal_costs
DROP POLICY IF EXISTS "Admins can manage meal costs" ON public.meal_costs;
CREATE POLICY "Admins and Super Admins can manage meal costs" ON public.meal_costs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- utility_expenses
DROP POLICY IF EXISTS "Admins can manage utility expenses" ON public.utility_expenses;
CREATE POLICY "Admins and Super Admins can manage utility expenses" ON public.utility_expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- common_expenses
DROP POLICY IF EXISTS "Admins can manage common expenses" ON public.common_expenses;
CREATE POLICY "Admins and Super Admins can manage common expenses" ON public.common_expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- bajar_list
DROP POLICY IF EXISTS "Admins can manage bajar list" ON public.bajar_list;
CREATE POLICY "Admins and Super Admins can manage bajar list" ON public.bajar_list
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- monthly_balances
DROP POLICY IF EXISTS "Admins can manage monthly balances" ON public.monthly_balances;
CREATE POLICY "Admins and Super Admins can manage monthly balances" ON public.monthly_balances
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 3. Update RLS policies for USERS table
-- Allow Super Admins to update any user (to manage roles)
CREATE POLICY "Super Admins can update any profile" ON public.users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Allow Super Admins to delete users
CREATE POLICY "Super Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 4. Initial role assignment
-- nadiatul.sakib@gmail.com -> super_admin
UPDATE public.users SET role = 'super_admin' WHERE email = 'nadiatul.sakib@gmail.com';

-- shehubhossen8@gmail.com -> admin
UPDATE public.users SET role = 'admin' WHERE email = 'shehubhossen8@gmail.com';
