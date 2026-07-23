-- =====================================================================
-- Lock company billing columns to the service role (close self-upgrade)
-- =====================================================================
-- Previously the prevent_company_billing_change trigger exempted workspace
-- admins, and RLS "Admins update own company" lets an admin UPDATE their own
-- companies row. Because handle_new_user makes every workspace owner an admin,
-- any user could self-assign a paid plan for free (directly, or via the QA
-- setCompanyPlan path) — bypassing Stripe entirely.
--
-- After this, plan / subscription_status / trial_ends_at may ONLY be changed by
-- the service role (the Stripe webhook and the service-role admin client).
-- automated_jobs_count keeps its prior behaviour (admins may still adjust it).
--
-- Approved-pending: run with `supabase db push` (or the SQL editor) — not
-- applied automatically here.

create or replace function public.prevent_company_billing_change()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  -- Billing / entitlement columns: service role only (Stripe webhook).
  if coalesce(auth.role(), '') <> 'service_role' then
    new.subscription_status := old.subscription_status;
    new.plan               := old.plan;
    new.trial_ends_at      := old.trial_ends_at;
  end if;

  -- automated_jobs_count: unchanged — service role or workspace admin may set.
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role(auth.uid(), 'admin') then
    new.automated_jobs_count := old.automated_jobs_count;
  end if;

  return new;
end;
$$;
