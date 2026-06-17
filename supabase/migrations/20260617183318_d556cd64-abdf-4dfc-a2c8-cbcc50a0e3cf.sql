ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS team_size TEXT,
  ADD COLUMN IF NOT EXISTS yearly_revenue TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business TEXT;