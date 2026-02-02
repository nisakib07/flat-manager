-- Create utility_collections table
CREATE TABLE IF NOT EXISTS public.utility_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL,
    utility_type TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(month, utility_type, user_id)
);

-- Enable RLS
ALTER TABLE public.utility_collections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.utility_collections
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins" ON public.utility_collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable update for admins" ON public.utility_collections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins" ON public.utility_collections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Add unique constraint to utility_expenses for upsert support
ALTER TABLE public.utility_expenses 
ADD CONSTRAINT utility_expenses_month_type_key UNIQUE (month, expense_type);
