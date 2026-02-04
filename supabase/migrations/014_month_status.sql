-- Create month_status table
CREATE TABLE IF NOT EXISTS public.month_status (
    month TEXT PRIMARY KEY, -- Format: 'YYYY-MM'
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.month_status ENABLE ROW LEVEL SECURITY;

-- Policies for month_status
-- Everyone can view month status
CREATE POLICY "Everyone can view month status" ON public.month_status
    FOR SELECT
    USING (true);

-- Only super_admin can insert/update month status
CREATE POLICY "Super admin can manage month status" ON public.month_status
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
        )
    );

-- Grant permissions
GRANT SELECT ON public.month_status TO authenticated;
GRANT ALL ON public.month_status TO authenticated; -- RLS will restrict actual access
