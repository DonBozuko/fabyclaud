CREATE TABLE IF NOT EXISTS public.escola_cron (
  id BOOLEAN NOT NULL PRIMARY KEY DEFAULT true,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT escola_cron_linha_unica CHECK (id)
);
GRANT ALL ON public.escola_cron TO service_role;
ALTER TABLE public.escola_cron ENABLE ROW LEVEL SECURITY;
INSERT INTO public.escola_cron (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE t TEXT;
BEGIN
  SELECT token INTO t FROM public.escola_cron WHERE id;
  PERFORM cron.unschedule('escola-das-ias') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'escola-das-ias');
  PERFORM cron.schedule(
    'escola-das-ias',
    '17 * * * *',
    format($cmd$select net.http_post(url := %L, headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb) $cmd$,
      'https://project--e8d80aae-3c61-4b11-be91-7aa723851320.lovable.app/api/public/estudar?chave=' || t)
  );
END $$;