ALTER TABLE public.agent_rules
  ADD COLUMN IF NOT EXISTS outreach_start_hour integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS outreach_end_hour integer NOT NULL DEFAULT 19,
  ADD COLUMN IF NOT EXISTS max_autonomous_discount numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS follow_up_trigger text NOT NULL DEFAULT 'Every 3 Days',
  ADD COLUMN IF NOT EXISTS auto_approve_limit numeric NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS handoff_keyword text NOT NULL DEFAULT 'HUMAN',
  ADD COLUMN IF NOT EXISTS weather_rain boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weather_heat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weather_freeze boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_strictness integer NOT NULL DEFAULT 50;