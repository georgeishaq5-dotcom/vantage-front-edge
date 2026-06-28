-- =====================================================================
-- 09 · New-user provisioning + realtime
-- =====================================================================

-- On sign-up: create a fresh workspace, the profile, and a role
-- (first user in the project = admin, everyone else = field_tech).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  role_count int;
  new_company_id uuid;
begin
  insert into public.companies (name)
  values (coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'My Workspace'))
  returning id into new_company_id;

  insert into public.profiles (id, email, full_name, company_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), new_company_id)
  on conflict (id) do update set company_id = coalesce(public.profiles.company_id, excluded.company_id);

  select count(*) into role_count from public.user_roles;
  insert into public.user_roles (user_id, role)
  values (new.id, case when role_count = 0 then 'admin'::public.app_role else 'field_tech'::public.app_role end)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, public, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime: stream job_locks so collaborators see live lock state.
do $$ begin
  alter publication supabase_realtime add table public.job_locks;
exception when duplicate_object then null;
end $$;
