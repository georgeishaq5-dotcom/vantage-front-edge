
CREATE TYPE public.voice_tone AS ENUM ('Enthusiastic', 'Professional', 'Direct');
CREATE TYPE public.veto_level AS ENUM ('Full Manual Review', 'Semi-Autonomous');
CREATE TYPE public.outreach_status AS ENUM ('Pending', 'Approved', 'Vetoed');

CREATE TABLE public.agent_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_zip_codes text[] NOT NULL DEFAULT '{}',
  min_profit_margin numeric NOT NULL DEFAULT 0,
  voice_tone voice_tone NOT NULL DEFAULT 'Professional',
  veto_level veto_level NOT NULL DEFAULT 'Full Manual Review',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_rules TO anon, authenticated;
GRANT ALL ON public.agent_rules TO service_role;
ALTER TABLE public.agent_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage agent_rules" ON public.agent_rules FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.neighbor_outreach (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  neighbor_addresses text[] NOT NULL DEFAULT '{}',
  cost numeric NOT NULL DEFAULT 10,
  status outreach_status NOT NULL DEFAULT 'Pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.neighbor_outreach TO anon, authenticated;
GRANT ALL ON public.neighbor_outreach TO service_role;
ALTER TABLE public.neighbor_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage neighbor_outreach" ON public.neighbor_outreach FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_rules_updated_at BEFORE UPDATE ON public.agent_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_neighbor_outreach_updated_at BEFORE UPDATE ON public.neighbor_outreach
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
