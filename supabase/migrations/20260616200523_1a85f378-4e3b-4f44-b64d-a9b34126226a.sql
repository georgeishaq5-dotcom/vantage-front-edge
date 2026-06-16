CREATE TYPE public.team_role AS ENUM ('Owner/Admin', 'Dispatcher', 'Field Tech');
CREATE TYPE public.member_status AS ENUM ('Active', 'Busy', 'Offline');

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL DEFAULT 'vantage-co',
  full_name text NOT NULL,
  role public.team_role NOT NULL DEFAULT 'Field Tech',
  status public.member_status NOT NULL DEFAULT 'Offline',
  skills text[] NOT NULL DEFAULT '{}',
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage team_members" ON public.team_members FOR ALL TO public USING (true) WITH CHECK (true);
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.job_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, team_member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_assignments TO anon;
GRANT ALL ON public.job_assignments TO service_role;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage job_assignments" ON public.job_assignments FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.jobs ADD COLUMN scheduled_by_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL;

CREATE TABLE public.job_locks (
  job_id uuid PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  locked_by_id text NOT NULL,
  locked_by_name text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_locks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_locks TO anon;
GRANT ALL ON public.job_locks TO service_role;
ALTER TABLE public.job_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage job_locks" ON public.job_locks FOR ALL TO public USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_locks;