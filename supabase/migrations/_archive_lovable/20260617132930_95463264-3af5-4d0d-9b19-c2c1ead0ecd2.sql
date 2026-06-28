-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher', 'field_tech');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Link team members to login accounts (must exist before helper function)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Security-definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher');
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_job(_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_assignments ja
    JOIN public.team_members tm ON tm.id = ja.team_member_id
    WHERE ja.job_id = _job_id AND tm.user_id = auth.uid()
  );
$$;

-- 4. user_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Auto-assign roles on signup (first user = admin, rest = field_tech)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  role_count int;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO role_count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN role_count = 0 THEN 'admin'::public.app_role ELSE 'field_tech'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Seed existing users as admins so the app keeps working
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Replace permissive write policies with role-based ones (reads stay open to authenticated)

-- agent_rules: admin only writes
DROP POLICY IF EXISTS "Authenticated can write agent_rules" ON public.agent_rules;
DROP POLICY IF EXISTS "Authenticated can update agent_rules" ON public.agent_rules;
DROP POLICY IF EXISTS "Authenticated can delete agent_rules" ON public.agent_rules;
CREATE POLICY "Admins write agent_rules" ON public.agent_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update agent_rules" ON public.agent_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete agent_rules" ON public.agent_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- customers: admin/dispatcher writes
DROP POLICY IF EXISTS "Authenticated can write customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can delete customers" ON public.customers;
CREATE POLICY "Managers write customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.can_manage());
CREATE POLICY "Managers update customers" ON public.customers FOR UPDATE TO authenticated USING (public.can_manage()) WITH CHECK (public.can_manage());
CREATE POLICY "Managers delete customers" ON public.customers FOR DELETE TO authenticated USING (public.can_manage());

-- jobs: managers full write; assigned field techs may update their jobs
DROP POLICY IF EXISTS "Authenticated can write jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated can delete jobs" ON public.jobs;
CREATE POLICY "Managers write jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.can_manage());
CREATE POLICY "Managers delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.can_manage());
CREATE POLICY "Update jobs managers or assigned tech" ON public.jobs FOR UPDATE TO authenticated
  USING (public.can_manage() OR public.is_assigned_to_job(id))
  WITH CHECK (public.can_manage() OR public.is_assigned_to_job(id));

-- job_assignments: managers only
DROP POLICY IF EXISTS "Authenticated can write job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Authenticated can update job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Authenticated can delete job_assignments" ON public.job_assignments;
CREATE POLICY "Managers write job_assignments" ON public.job_assignments FOR INSERT TO authenticated WITH CHECK (public.can_manage());
CREATE POLICY "Managers update job_assignments" ON public.job_assignments FOR UPDATE TO authenticated USING (public.can_manage()) WITH CHECK (public.can_manage());
CREATE POLICY "Managers delete job_assignments" ON public.job_assignments FOR DELETE TO authenticated USING (public.can_manage());

-- neighbor_outreach: managers only
DROP POLICY IF EXISTS "Authenticated can write neighbor_outreach" ON public.neighbor_outreach;
DROP POLICY IF EXISTS "Authenticated can update neighbor_outreach" ON public.neighbor_outreach;
DROP POLICY IF EXISTS "Authenticated can delete neighbor_outreach" ON public.neighbor_outreach;
CREATE POLICY "Managers write neighbor_outreach" ON public.neighbor_outreach FOR INSERT TO authenticated WITH CHECK (public.can_manage());
CREATE POLICY "Managers update neighbor_outreach" ON public.neighbor_outreach FOR UPDATE TO authenticated USING (public.can_manage()) WITH CHECK (public.can_manage());
CREATE POLICY "Managers delete neighbor_outreach" ON public.neighbor_outreach FOR DELETE TO authenticated USING (public.can_manage());

-- team_members: admin only writes
DROP POLICY IF EXISTS "Authenticated can write team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can update team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can delete team_members" ON public.team_members;
CREATE POLICY "Admins write team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update team_members" ON public.team_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete team_members" ON public.team_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));