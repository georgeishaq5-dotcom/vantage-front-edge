-- 1. COMPANIES (tenant/workspace) -------------------------------------------
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Link profiles to a company --------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Security-definer helper: the caller's company id (no RLS recursion)
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- companies RLS: members can see/manage only their own company
CREATE POLICY "Members read own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.current_company_id());
CREATE POLICY "Members update own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.current_company_id())
  WITH CHECK (id = public.current_company_id());
-- Allow creating a new workspace (open sign-up); the new id is then linked to the profile
CREATE POLICY "Authenticated create company" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Backfill: give every existing profile its own workspace -----------------
DO $$
DECLARE p RECORD; cid uuid;
BEGIN
  FOR p IN SELECT id, company_name FROM public.profiles WHERE company_id IS NULL LOOP
    INSERT INTO public.companies (name) VALUES (COALESCE(NULLIF(p.company_name, ''), 'My Workspace'))
      RETURNING id INTO cid;
    UPDATE public.profiles SET company_id = cid WHERE id = p.id;
  END LOOP;
END $$;

-- 4. New-user trigger: open sign-up creates a fresh workspace ----------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_count int;
  new_company_id uuid;
BEGIN
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), 'My Workspace'))
  RETURNING id INTO new_company_id;

  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), new_company_id)
  ON CONFLICT (id) DO UPDATE SET company_id = COALESCE(public.profiles.company_id, EXCLUDED.company_id);

  SELECT count(*) INTO role_count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN role_count = 0 THEN 'admin'::public.app_role ELSE 'field_tech'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. PROFILES security: own-row only (incl. DELETE) -------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- 6. Rebuild CUSTOMERS from scratch -----------------------------------------
DROP TABLE IF EXISTS public.customers CASCADE;
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  email text,
  address text,
  service_address text,
  customer_type text,
  site_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select customers" ON public.customers
  FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "Tenant insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "Tenant update customers" ON public.customers
  FOR UPDATE TO authenticated USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "Tenant delete customers" ON public.customers
  FOR DELETE TO authenticated USING (company_id = public.current_company_id());

-- 7. Rebuild JOBS from scratch ----------------------------------------------
DROP TABLE IF EXISTS public.jobs CASCADE;
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  assigned_tech_id uuid,
  job_phase text,
  skill_tag text,
  status text NOT NULL DEFAULT 'Quoted',
  title text NOT NULL DEFAULT 'New Job',
  description text,
  scheduled_date timestamptz,
  service_date date,
  total_amount numeric NOT NULL DEFAULT 0,
  quote_amount numeric NOT NULL DEFAULT 0,
  scheduled_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select jobs" ON public.jobs
  FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "Tenant insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "Tenant update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "Tenant delete jobs" ON public.jobs
  FOR DELETE TO authenticated USING (company_id = public.current_company_id());