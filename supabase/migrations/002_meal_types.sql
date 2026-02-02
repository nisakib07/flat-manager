-- Meal Types Table (pre-defined meals with fixed weights)
CREATE TABLE IF NOT EXISTS public.meal_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    weight NUMERIC NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Meals Table (what's being served for lunch/dinner each day)
CREATE TABLE IF NOT EXISTS public.daily_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_date DATE NOT NULL,
    meal_time TEXT NOT NULL CHECK (meal_time IN ('Lunch', 'Dinner')),
    meal_type_id UUID REFERENCES public.meal_types(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(meal_date, meal_time)
);

-- Enable RLS
ALTER TABLE public.meal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_types
CREATE POLICY "Anyone can view meal types" ON public.meal_types
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meal types" ON public.meal_types
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for daily_meals
CREATE POLICY "Anyone can view daily meals" ON public.daily_meals
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage daily meals" ON public.daily_meals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Pre-populate with common Bengali meals
INSERT INTO public.meal_types (name, weight) VALUES
    ('ডিম খিচুড়ি', 6),
    ('মুরগি খিচুড়ি', 8),
    ('শুধু ভাত', 2),
    ('গরুর মাংস ভাত', 15),
    ('মাছ ভাত', 7),
    ('ডিম ভাত', 5),
    ('মুরগি ভাত', 9),
    ('সবজি ভাত', 5),
    ('ভর্তা ভাত', 8),
    ('বিরিয়ানি', 10)
ON CONFLICT (name) DO NOTHING;
