
CREATE TYPE public.customer_type AS ENUM ('Residential', 'Commercial', 'HOA');
CREATE TYPE public.job_status AS ENUM ('Quoted', 'Scheduled', 'Completed', 'Paid');

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  customer_type public.customer_type,
  service_address TEXT,
  site_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status public.job_status NOT NULL DEFAULT 'Quoted',
  service_date DATE,
  quote_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public can manage profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.customers (full_name, email, phone, customer_type, service_address, site_notes) VALUES
('Aurora Bay Resort', 'ops@aurorabay.com', '(555) 201-3344', 'Commercial', '1200 Harbor Dr, Seattle, WA', 'Gate code 4821. Loading dock at rear.'),
('Maria Delgado', 'maria.d@example.com', '(555) 882-1190', 'Residential', '47 Cedar Lane, Portland, OR', 'Dog in backyard. Side gate latch sticks.'),
('Crestview HOA', 'board@crestviewhoa.org', '(555) 410-7765', 'HOA', '88 Crestview Blvd, Bellevue, WA', 'Contact front desk for clubhouse access.'),
('James Whitaker', 'jwhitaker@example.com', '(555) 333-9087', 'Residential', '912 Maple Ct, Tacoma, WA', NULL),
('Summit Logistics', 'facilities@summitlog.com', '(555) 600-2210', 'Commercial', '500 Industrial Pkwy, Kent, WA', 'Check in with security. Hard hat required.');

INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Quarterly HVAC inspection', 'Scheduled', CURRENT_DATE, 480.00 FROM public.customers WHERE full_name = 'Aurora Bay Resort';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Irrigation repair', 'Scheduled', CURRENT_DATE, 320.00 FROM public.customers WHERE full_name = 'Maria Delgado';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Landscape lighting install', 'Quoted', CURRENT_DATE + 5, 1250.00 FROM public.customers WHERE full_name = 'Crestview HOA';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Roof leak assessment', 'Completed', CURRENT_DATE - 3, 275.00 FROM public.customers WHERE full_name = 'James Whitaker';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Dock pressure washing', 'Paid', CURRENT_DATE - 10, 640.00 FROM public.customers WHERE full_name = 'Summit Logistics';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Emergency plumbing call', 'Paid', CURRENT_DATE - 1, 410.00 FROM public.customers WHERE full_name = 'Maria Delgado';
INSERT INTO public.jobs (customer_id, title, status, service_date, quote_amount)
SELECT id, 'Generator maintenance', 'Scheduled', CURRENT_DATE, 540.00 FROM public.customers WHERE full_name = 'Summit Logistics';
