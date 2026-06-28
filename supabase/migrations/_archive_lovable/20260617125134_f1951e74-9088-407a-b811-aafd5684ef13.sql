-- 1. Drop all existing permissive public policies on app tables
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('agent_rules','customers','job_assignments','job_locks','jobs','neighbor_outreach','profiles','team_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- 2. Revoke public/anon access, grant to authenticated + service_role
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_rules','customers','job_assignments','job_locks','jobs','neighbor_outreach','profiles','team_members']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM public', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 3. Authenticated-staff policies for shared operational tables
CREATE POLICY "Authenticated can read agent_rules" ON public.agent_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write agent_rules" ON public.agent_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update agent_rules" ON public.agent_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete agent_rules" ON public.agent_rules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read job_assignments" ON public.job_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write job_assignments" ON public.job_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update job_assignments" ON public.job_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete job_assignments" ON public.job_assignments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read job_locks" ON public.job_locks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write job_locks" ON public.job_locks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update job_locks" ON public.job_locks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete job_locks" ON public.job_locks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read neighbor_outreach" ON public.neighbor_outreach FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write neighbor_outreach" ON public.neighbor_outreach FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update neighbor_outreach" ON public.neighbor_outreach FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete neighbor_outreach" ON public.neighbor_outreach FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);

-- 4. Profiles: each user manages only their own row
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();