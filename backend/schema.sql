-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  currency_preference TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means system category
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expenses table (Header)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  store_name TEXT,
  tax NUMERIC(15, 2) DEFAULT 0,
  description TEXT,
  receipt_image_key TEXT,
  is_income BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expense Items table (Itemized List - 3NF)
CREATE TABLE IF NOT EXISTS public.expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Profiles: Users can see/update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Users can see system categories and their own
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can create own categories" ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid());

-- Expenses: Users can see/edit only their own
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (user_id = auth.uid());

-- Expense Items: Linked to expenses RLS
CREATE POLICY "Users can view own expense items" ON public.expense_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_items.expense_id AND expenses.user_id = auth.uid())
);
CREATE POLICY "Users can insert own expense items" ON public.expense_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_items.expense_id AND expenses.user_id = auth.uid())
);
CREATE POLICY "Users can delete own expense items" ON public.expense_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_items.expense_id AND expenses.user_id = auth.uid())
);
CREATE POLICY "Users can update own expense items" ON public.expense_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_items.expense_id AND expenses.user_id = auth.uid())
);

-- 6. Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Unique system category names (user_id IS NULL) so seed re-runs are idempotent
CREATE UNIQUE INDEX IF NOT EXISTS categories_system_name_uidx
  ON public.categories (name)
  WHERE user_id IS NULL;

-- Insert Default Categories (skip if system category with same name already exists)
INSERT INTO public.categories (name, icon, color)
SELECT v.name, v.icon, v.color
FROM (VALUES
  ('Food', 'fast-food', '#f9c5d1'),
  ('Clothes', 'shirt', '#cbe2c8'),
  ('Transport', 'bus', '#f1e6a0'),
  ('Entertainment', 'film', '#d0d1e6'),
  ('Others', 'grid', '#e2e8f0')
) AS v(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.name = v.name AND c.user_id IS NULL
);
