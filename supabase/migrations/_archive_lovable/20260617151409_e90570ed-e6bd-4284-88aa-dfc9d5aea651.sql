DROP POLICY IF EXISTS "Authenticated can write job_locks" ON public.job_locks;
DROP POLICY IF EXISTS "Authenticated can update job_locks" ON public.job_locks;
DROP POLICY IF EXISTS "Authenticated can delete job_locks" ON public.job_locks;

CREATE POLICY "Users can create their own job_locks"
  ON public.job_locks FOR INSERT TO authenticated
  WITH CHECK (locked_by_id = auth.uid()::text);

CREATE POLICY "Users can update their own job_locks"
  ON public.job_locks FOR UPDATE TO authenticated
  USING (locked_by_id = auth.uid()::text)
  WITH CHECK (locked_by_id = auth.uid()::text);

CREATE POLICY "Users can delete their own job_locks"
  ON public.job_locks FOR DELETE TO authenticated
  USING (locked_by_id = auth.uid()::text);