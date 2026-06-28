
-- Helper: does a job belong to the caller's company (RLS-safe, definer)
CREATE OR REPLACE FUNCTION public.job_in_current_company(_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = _job_id
      AND jobs.company_id = public.current_company_id()
  );
$$;

-- ===== companies: restrict UPDATE to admins =====
DROP POLICY IF EXISTS "Members update own company" ON public.companies;
CREATE POLICY "Admins update own company"
  ON public.companies FOR UPDATE TO authenticated
  USING (id = current_company_id() AND has_role(auth.uid(), 'admin'))
  WITH CHECK (id = current_company_id() AND has_role(auth.uid(), 'admin'));

-- ===== agent_rules: add company scoping =====
ALTER TABLE public.agent_rules
  ADD COLUMN IF NOT EXISTS company_id uuid;

UPDATE public.agent_rules
  SET company_id = (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)
  WHERE company_id IS NULL;

ALTER TABLE public.agent_rules
  ALTER COLUMN company_id SET DEFAULT public.current_company_id();

DROP POLICY IF EXISTS "Authenticated can read agent_rules" ON public.agent_rules;
CREATE POLICY "Members read own company agent_rules"
  ON public.agent_rules FOR SELECT TO authenticated
  USING (company_id = current_company_id());

DROP POLICY IF EXISTS "Admins write agent_rules" ON public.agent_rules;
CREATE POLICY "Admins write agent_rules"
  ON public.agent_rules FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = current_company_id());

DROP POLICY IF EXISTS "Admins update agent_rules" ON public.agent_rules;
CREATE POLICY "Admins update agent_rules"
  ON public.agent_rules FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = current_company_id())
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = current_company_id());

DROP POLICY IF EXISTS "Admins delete agent_rules" ON public.agent_rules;
CREATE POLICY "Admins delete agent_rules"
  ON public.agent_rules FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = current_company_id());

-- ===== team_members: company scope (company_id is text) =====
DROP POLICY IF EXISTS "Authenticated can read team_members" ON public.team_members;
CREATE POLICY "Members read own company team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (company_id = current_company_id()::text);

DROP POLICY IF EXISTS "Admins write team_members" ON public.team_members;
CREATE POLICY "Admins write team_members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = current_company_id()::text);

DROP POLICY IF EXISTS "Admins update team_members" ON public.team_members;
CREATE POLICY "Admins update team_members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = current_company_id()::text)
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = current_company_id()::text);

DROP POLICY IF EXISTS "Admins delete team_members" ON public.team_members;
CREATE POLICY "Admins delete team_members"
  ON public.team_members FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = current_company_id()::text);

-- ===== job_assignments: scope via parent job's company =====
DROP POLICY IF EXISTS "Authenticated can read job_assignments" ON public.job_assignments;
CREATE POLICY "Members read own company job_assignments"
  ON public.job_assignments FOR SELECT TO authenticated
  USING (job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers write job_assignments" ON public.job_assignments;
CREATE POLICY "Managers write job_assignments"
  ON public.job_assignments FOR INSERT TO authenticated
  WITH CHECK (can_manage() AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers update job_assignments" ON public.job_assignments;
CREATE POLICY "Managers update job_assignments"
  ON public.job_assignments FOR UPDATE TO authenticated
  USING (can_manage() AND job_in_current_company(job_id))
  WITH CHECK (can_manage() AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers delete job_assignments" ON public.job_assignments;
CREATE POLICY "Managers delete job_assignments"
  ON public.job_assignments FOR DELETE TO authenticated
  USING (can_manage() AND job_in_current_company(job_id));

-- ===== job_locks: scope via parent job's company =====
DROP POLICY IF EXISTS "Authenticated can read job_locks" ON public.job_locks;
CREATE POLICY "Members read own company job_locks"
  ON public.job_locks FOR SELECT TO authenticated
  USING (job_in_current_company(job_id));

DROP POLICY IF EXISTS "Users can create their own job_locks" ON public.job_locks;
CREATE POLICY "Users can create their own job_locks"
  ON public.job_locks FOR INSERT TO authenticated
  WITH CHECK (locked_by_id = (auth.uid())::text AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Users can update their own job_locks" ON public.job_locks;
CREATE POLICY "Users can update their own job_locks"
  ON public.job_locks FOR UPDATE TO authenticated
  USING (locked_by_id = (auth.uid())::text AND job_in_current_company(job_id))
  WITH CHECK (locked_by_id = (auth.uid())::text AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Users can delete their own job_locks" ON public.job_locks;
CREATE POLICY "Users can delete their own job_locks"
  ON public.job_locks FOR DELETE TO authenticated
  USING (locked_by_id = (auth.uid())::text AND job_in_current_company(job_id));

-- ===== neighbor_outreach: scope via parent job's company =====
DROP POLICY IF EXISTS "Authenticated can read neighbor_outreach" ON public.neighbor_outreach;
CREATE POLICY "Members read own company neighbor_outreach"
  ON public.neighbor_outreach FOR SELECT TO authenticated
  USING (job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers write neighbor_outreach" ON public.neighbor_outreach;
CREATE POLICY "Managers write neighbor_outreach"
  ON public.neighbor_outreach FOR INSERT TO authenticated
  WITH CHECK (can_manage() AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers update neighbor_outreach" ON public.neighbor_outreach;
CREATE POLICY "Managers update neighbor_outreach"
  ON public.neighbor_outreach FOR UPDATE TO authenticated
  USING (can_manage() AND job_in_current_company(job_id))
  WITH CHECK (can_manage() AND job_in_current_company(job_id));

DROP POLICY IF EXISTS "Managers delete neighbor_outreach" ON public.neighbor_outreach;
CREATE POLICY "Managers delete neighbor_outreach"
  ON public.neighbor_outreach FOR DELETE TO authenticated
  USING (can_manage() AND job_in_current_company(job_id));
