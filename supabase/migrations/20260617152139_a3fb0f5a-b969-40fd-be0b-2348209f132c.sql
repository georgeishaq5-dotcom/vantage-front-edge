ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE public.trade_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profession text NOT NULL DEFAULT 'General Field Service',
  base_job_title text NOT NULL DEFAULT 'Base Job',
  base_job_description text NOT NULL DEFAULT 'Core service & labor',
  base_price numeric NOT NULL DEFAULT 480,
  upgrades jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_presets TO authenticated;
GRANT ALL ON public.trade_presets TO service_role;

ALTER TABLE public.trade_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view trade presets"
  ON public.trade_presets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can insert trade presets"
  ON public.trade_presets FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage());

CREATE POLICY "Managers can update trade presets"
  ON public.trade_presets FOR UPDATE
  TO authenticated
  USING (public.can_manage())
  WITH CHECK (public.can_manage());

CREATE POLICY "Managers can delete trade presets"
  ON public.trade_presets FOR DELETE
  TO authenticated
  USING (public.can_manage());

CREATE TRIGGER update_trade_presets_updated_at
  BEFORE UPDATE ON public.trade_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.trade_presets (profession, base_job_title, base_job_description, base_price, upgrades)
VALUES (
  'General Field Service',
  'Base Job',
  'Core service & labor',
  480,
  '[
    {"key":"premium-parts","name":"Premium-grade parts","description":"Longer-lasting components with extended manufacturer coverage.","price":180,"recommended":true},
    {"key":"warranty","name":"Extended 3-year warranty","description":"Full workmanship coverage for three years instead of 30 days.","price":220,"recommended":false},
    {"key":"inspection","name":"Full system safety inspection","description":"Top-to-bottom check of the surrounding system while we are on site.","price":95,"recommended":true},
    {"key":"maintenance","name":"Annual maintenance plan","description":"One scheduled tune-up per year to prevent future breakdowns.","price":140,"recommended":false},
    {"key":"priority","name":"Priority scheduling & 24/7 support","description":"Front-of-line booking and emergency phone support.","price":75,"recommended":false}
  ]'::jsonb
);